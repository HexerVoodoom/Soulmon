#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Smoke do APK no emulador. Roda DENTRO do reactivecircus/android-emulator-runner
# (o emulador já está de pé e o `adb` já enxerga o device).
#
# Regra deste script: cada `exit 1` corresponde a um defeito que o usuário
# sentiria. Nada aqui falha por lentidão de emulador sem antes tentar de novo —
# um smoke que dá falso vermelho é desligado na terceira vez, e aí a ponte volta
# a não ter dono.
# ---------------------------------------------------------------------------
set -uo pipefail

PKG="com.hexervoodoom.soulmon"
ACT="$PKG/.MainActivity"
OUT="smoke-out"
mkdir -p "$OUT"

fail() { echo "::error::SMOKE: $*"; dump; exit 1; }

# O diagnóstico precisa aparecer NA PÁGINA DO RUN, não só num artefato que
# exige login para baixar. Na primeira falha deste script não deu para saber o
# motivo sem baixar `apk-smoke-<sha>.zip` — o que torna o alarme quase inútil
# para quem só olha a lista de runs.
dump() {
  adb logcat -d > "$OUT/logcat-full.txt" 2>/dev/null || true
  adb exec-out screencap -p > "$OUT/tela.png" 2>/dev/null || true

  echo "::group::diagnóstico: estado do device"
  adb devices -l 2>&1 || true
  adb shell getprop sys.boot_completed 2>&1 || true
  echo "pacotes instalados que casam com o nosso id:"
  adb shell pm list packages 2>/dev/null | grep -i "soulmon\|digiapp" || echo "  (nenhum)"
  echo "processo vivo? -> $(adb shell pidof "$PKG" 2>/dev/null | tr -d '\r' || echo 'não')"
  echo "::endgroup::"

  echo "::group::diagnóstico: últimas 120 linhas do logcat"
  tail -n 120 "$OUT/logcat-full.txt" 2>/dev/null || echo "  (logcat vazio)"
  echo "::endgroup::"

  echo "::group::diagnóstico: linhas de erro/Capacitor/WebView"
  grep -iE "FATAL|AndroidRuntime|ANR |Capacitor|WebView|net::ERR|ERR_|chromium" \
    "$OUT/logcat-full.txt" 2>/dev/null | tail -n 60 || echo "  (nada)"
  echo "::endgroup::"
}

echo "== 1. instalando =="
adb install -r -g apk/app-debug.apk || fail "adb install falhou"

adb logcat -c

echo "== 2. subindo o app =="
adb shell am start -W -n "$ACT" || fail "am start falhou"

# A WebView carrega a URL de PRODUÇÃO — dar tempo de rede é obrigatório aqui.
sleep 25

echo "== 3. o processo continua vivo? =="
PID="$(adb shell pidof "$PKG" | tr -d '\r')"
[ -n "$PID" ] || fail "o app morreu depois de subir (sem processo). Isso é crash de inicialização."
echo "pid=$PID"

echo "== 4. crash no logcat? =="
adb logcat -d > "$OUT/logcat-full.txt"
if grep -q "FATAL EXCEPTION" "$OUT/logcat-full.txt"; then
  grep -A 30 "FATAL EXCEPTION" "$OUT/logcat-full.txt" | head -60
  fail "FATAL EXCEPTION no logcat"
fi
if grep -qE "ANR in $PKG" "$OUT/logcat-full.txt"; then
  fail "ANR — o app travou a thread principal na inicialização"
fi

echo "== 5. a ponte Capacitor subiu? =="
grep -iE "Capacitor|Loading app|WebView" "$OUT/logcat-full.txt" | head -40 > "$OUT/capacitor.txt"
grep -qi "capacitor" "$OUT/logcat-full.txt" \
  || fail "nenhuma linha do Capacitor no logcat — a WebView não inicializou"

echo "== 6. a ponte RESPONDEU? (JS -> Capacitor -> Kotlin -> SharedPreferences) =="
# `DigiWidgetPrefs.xml` só existe se o Kotlin de DigiWidgetPlugin.updateWidgetData
# tiver rodado, e ele só roda porque o JS o chamou (src/App.tsx:411). É a única
# asserção deste arquivo que atravessa as duas linguagens.
# Espera generosa DE PROPÓSITO: a WebView precisa baixar a URL de produção
# dentro do runner, e o custo de esperar demais é um minuto de CI, enquanto o
# custo de esperar de menos é um alarme falso — e alarme falso mata o alarme.
PREFS=""
for i in $(seq 1 24); do
  PREFS="$(adb shell run-as "$PKG" cat shared_prefs/DigiWidgetPrefs.xml 2>/dev/null | tr -d '\r')"
  [ -n "$PREFS" ] && break
  if [ "$i" = "6" ] || [ "$i" = "18" ]; then
    # Mostra o que existe: distingue "o app nem criou shared_prefs" (não
    # chegou a montar) de "criou outros arquivos mas não este" (o plugin não
    # rodou), e isso muda completamente onde procurar.
    echo "  conteúdo de shared_prefs neste momento:"
    adb shell run-as "$PKG" ls -1 shared_prefs 2>/dev/null | sed 's/^/    /' || echo "    (não consegui ler)"
  fi
  echo "  ... ainda não (tentativa $i/24)"
  sleep 5
done

echo "$PREFS" > "$OUT/DigiWidgetPrefs.xml"
[ -n "$PREFS" ] || fail "a ponte não respondeu: DigiWidgetPrefs.xml não existe. JS->Kotlin não fechou (plugin não registrado, WebView sem carregar, ou App.tsx não montou)."
echo "$PREFS" | grep -q "current_stage" \
  || fail "a ponte gravou o arquivo mas SEM 'current_stage' — o payload do plugin mudou de forma incompatível"

echo "== 7. evidência =="
adb exec-out screencap -p > "$OUT/tela.png"
adb shell dumpsys package "$PKG" | grep -E "versionName|firstInstallTime" > "$OUT/pacote.txt" || true

echo "SMOKE OK: app sobe, não crasha, e a ponte Capacitor↔Kotlin respondeu."
