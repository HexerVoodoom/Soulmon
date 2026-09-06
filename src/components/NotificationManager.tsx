import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { DigiAlarm } from '../plugins/DigiAlarmPlugin';
// WP3.4 — dono único do texto e do horário das notificações agendadas. Este
// import é a fronteira que faltava: as três árvores (cliente, worker, cron)
// passam a ler a MESMA função. Ver o cabeçalho de `_pushCopy.js`.
import { pushCopy } from '../../functions/api/_pushCopy.js';
import {
  checkAndShowNotifications, showNotification, subscribeToPush, syncActivityAlarms, syncTaskAlarms,
  unsubscribeFromPush, registerForPushNotifications, unregisterFromPushNotifications,
} from '../utils/notifications';

interface Activity {
  id: string;
  name: string;
  alarm?: { time: string };
  weekDays?: number[];
}

interface Task {
  id: string;
  name: string;
  alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
  deadline?: { date: string; time: string };
}

interface NotificationManagerProps {
  activities: Activity[];
  tasks: Task[];
  userName: string;
  petName: string;
  /** WP1.17 — `bornAt` do save, para a copy dos primeiros dias. */
  bornAt?: string;
  language: 'pt-BR' | 'en-US';
  enabled: boolean;
  healthPoints: number;
  maxHealthPoints: number;
  completedSteps: number;
  totalRequired: number;
}

export function NotificationManager({
  activities,
  tasks,
  userName,
  petName,
  bornAt,
  language,
  enabled,
  healthPoints,
  maxHealthPoints,
  completedSteps,
  totalRequired,
}: NotificationManagerProps) {
  const lastEveningWarnDate = useRef<string>('');
  const lastNudge10Date = useRef<string>('');
  const lastNudge16Date = useRef<string>('');
  const lastGoodnightDate = useRef<string>('');

  // Push subscription — register/unregister when notifications toggle. Native
  // Android uses FCM (the WebView has no Web Push support); browsers/PWA use
  // Web Push VAPID.
  useEffect(() => {
    const isNativeAndroid = Capacitor.getPlatform() === 'android';

    if (enabled) {
      if (isNativeAndroid) {
        registerForPushNotifications(petName, language, (title, body) => {
          toast(title, { description: body });
        });
      } else {
        // WP1.17 — a idade vai junto: é ela que dá voz própria aos dias 1 e 2.
        subscribeToPush(petName, language, bornAt);
      }
    } else {
      if (isNativeAndroid) {
        unregisterFromPushNotifications();
      } else {
        unsubscribeFromPush();
      }
    }
  }, [enabled, petName, language]);

  // Sync alarms when activities or tasks change
  useEffect(() => {
    if (!enabled) return;
    syncActivityAlarms(activities, language);
    syncTaskAlarms(tasks, language);
  }, [activities, tasks, language, enabled]);

  // Check notifications every minute
  useEffect(() => {
    if (!enabled) return;

    checkAndShowNotifications(userName, language);

    const interval = setInterval(() => {
      checkAndShowNotifications(userName, language);
    }, 60000);

    return () => clearInterval(interval);
  }, [userName, language, enabled]);

  // Evening HP risk warning — fires once at 20:00 if HP critical and day not complete
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hh = now.getHours();
      const mm = now.getMinutes();
      const today = now.toDateString();

      if (hh !== 20 || mm !== 0) return;
      if (lastEveningWarnDate.current === today) return;

      // Antes isto prometia que "metade das tarefas" evitava a perda, o que é
      // falso (a perda zera só acima de 2/3 da meta), e chamava de "perigo" um
      // dia que custa no máximo 1 coração. Avisa sem ameaçar e sem inventar
      // número: quem quiser o detalhe abre o app.
      //
      // A CONDIÇÃO é a meta do dia, não o HP. Antes o lembrete geral exigia
      // `healthPoints < maxHealthPoints`, então quem estava com o pet de HP
      // cheio e não tinha feito nada NÃO recebia nada — justamente quem o
      // lembrete ajudaria. E quem já cumpriu a meta não recebe nada, aqui nem
      // em lugar nenhum: é o que separa lembrete de cobrança, e é por isso que
      // este aviso vive no CLIENTE — o worker não sabe se a meta foi cumprida
      // (a assinatura de push guarda só endpoint, chaves, nome e idioma), e foi
      // exatamente assim que o nudge das 21h passou a cobrar quem já tinha
      // feito tudo. Ver `functions/api/_pushCopy.js`.
      if (completedSteps >= totalRequired) return;

      const ispt = language === 'pt-BR';
      const hpBaixo = healthPoints <= 1 && healthPoints > 0;
      lastEveningWarnDate.current = today;

      if (hpBaixo) {
        showNotification(
          ispt ? `${petName} está meio pra baixo` : `${petName} is a bit low`,
          {
            body: ispt
              ? 'Se der, marque o que você já fez hoje. Se não der, amanhã seu Soulmon ainda vai estar aqui.'
              : "If you can, log what you did today. If not, it'll still be here tomorrow.",
            tag: 'hp-critical-evening',
          },
        );
      } else {
        // Diz O QUE fazer, e diz a regra de verdade: energia cheia é condição
        // do dia perfeito, e energia só enche comendo. Sem isso o lembrete
        // manda "abra o app" sem dizer para quê.
        showNotification(
          ispt ? `🌙 ${petName} está te esperando` : `🌙 ${petName} is waiting for you`,
          {
            body: ispt
              ? 'Marque o que você fez hoje e dê uma comidinha pro seu Soulmon — energia cheia fecha o dia perfeito.'
              : 'Log what you did today and feed it — a full energy bar completes a perfect day.',
            tag: 'evening-reminder',
          },
        );
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [enabled, healthPoints, maxHealthPoints, completedSteps, totalRequired, language]);

  // Pet reminder notifications — 10h, 16h, 21h (incomplete tasks) + 22h goodnight
  useEffect(() => {
    if (!enabled) return;

    // Native Android: schedule via AlarmManager so they fire even with app closed
    if (Capacitor.isNativePlatform()) {
      const lang = language === 'pt-BR' ? 'pt-BR' : 'en-US';
      /* WP3.4 — o alarme nativo também lê o DONO ÚNICO. Este caminho era a
         SEGUNDA cópia da copy dentro do mesmo arquivo (a outra era o poll
         web), e por ser Android puro ninguém olhava para ele: um texto
         corrigido no worker e no poll continuaria errado no APK instalado. */
      const nudge10 = pushCopy(10, petName, lang);
      const nudge16 = pushCopy(16, petName, lang);
      const boaNoite = pushCopy(22, petName, lang);

      // O nudge das 21h saiu: a auditoria de carga do plano conclui que nada
      // deve pedir uma quarta visita ao app, e cobrar tarefa na hora de dormir
      // é o oposto de um companheiro.
      if (completedSteps < totalRequired) {
        if (nudge10) DigiAlarm.scheduleAlarm({ id: nudge10.tag, title: nudge10.title, body: nudge10.body, scheduledTime: '10:00' }).catch(() => {});
        if (nudge16) DigiAlarm.scheduleAlarm({ id: nudge16.tag, title: nudge16.title, body: nudge16.body, scheduledTime: '16:00' }).catch(() => {});
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-21' }).catch(() => {});
      } else {
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-10' }).catch(() => {});
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-16' }).catch(() => {});
        DigiAlarm.cancelAlarm({ id: 'pet-nudge-21' }).catch(() => {});
      }

      if (boaNoite) {
        DigiAlarm.scheduleAlarm({
          id: boaNoite.tag,
          title: boaNoite.title,
          body: boaNoite.body,
          scheduledTime: '22:00',
        }).catch(() => {});
      }
    }

    /* WP3.4 — DEDUPE PWA × APK.
       No Android nativo os alarmes acima JÁ agendam as três notificações pelo
       AlarmManager (e o Web Push do worker chega pelo mesmo aparelho). O poll
       abaixo disparava mais uma vez, do mesmo aparelho, com o mesmo texto: a
       pessoa recebia a mesma frase duas ou três vezes seguidas às 10h.
       Notificação repetida não é um bug cosmético — é a razão número um pela
       qual alguém desliga push, e desligar push é irreversível na prática. */
    if (Capacitor.isNativePlatform()) return;

    // Web/PWA: poll every minute and fire when the clock hits the target hour
    const checkPetNotifications = () => {
      const now = new Date();
      const hh = now.getHours();
      const mm = now.getMinutes();
      const today = now.toDateString();
      const ispt = language === 'pt-BR';

      // Allow a 1-minute grace window so we don't miss if the interval fires at :01
      if (mm > 1) return;

      /* WP3.4 — O TEXTO VEM DO DONO ÚNICO (`functions/api/_pushCopy.js`).
         Esta função REIMPLEMENTAVA as três cópias, palavra por palavra, numa
         árvore que sobe sozinha no push da `main` — enquanto o worker é
         deploy manual. Foi exatamente assim que o nudge das 21h ficou vivo
         num lado depois de ter sido removido do outro, e o
         `pushCopy.parity.test.js` só cobria worker × módulo, nunca o cliente.
         Agora as TRÊS árvores leem a mesma função. O que continua sendo
         daqui é a CONDIÇÃO (só nudge com meta em aberto) e o dedupe por dia —
         condição é comportamento do cliente, texto é copy. */
      const copia = (h: number) => pushCopy(h, petName, ispt ? 'pt-BR' : 'en-US');

      // 10:00 — incomplete tasks nudge
      if (hh === 10 && completedSteps < totalRequired && lastNudge10Date.current !== today) {
        const c = copia(10);
        if (c) {
          lastNudge10Date.current = today;
          showNotification(c.title, { body: c.body, tag: c.tag });
        }
      }

      // 16:00 — incomplete tasks nudge
      if (hh === 16 && completedSteps < totalRequired && lastNudge16Date.current !== today) {
        const c = copia(16);
        if (c) {
          lastNudge16Date.current = today;
          showNotification(c.title, { body: c.body, tag: c.tag });
        }
      }

      // 22:00 — goodnight (always fires regardless of tasks)
      if (hh === 22 && lastGoodnightDate.current !== today) {
        const c = copia(22);
        if (c) {
          lastGoodnightDate.current = today;
          showNotification(c.title, { body: c.body, tag: c.tag });
        }
      }
    };

    checkPetNotifications();
    const interval = setInterval(checkPetNotifications, 60000);
    return () => clearInterval(interval);
  }, [enabled, petName, language, completedSteps, totalRequired]);

  return null;
}
