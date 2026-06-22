import { useState, useEffect } from 'react';
import bgCyberpunk from "figma:asset/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png";
import digiEggSprite from 'figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png';
import pichimonSprite from 'figma:asset/99ff747d7f7ecc2424e131a43c54669bcba9a301.png';
import pukamonSprite from 'figma:asset/104dc13e2c146bb51e00903d6eaa5f6fae7619c6.png';
import tapirmonSprite from 'figma:asset/7d2b0a9b519f16f1d0a258d9670cfc62230e1903.png';
import monochromon from 'figma:asset/7bc96986446973a3544f57a9055e59fc87022f42.png';
import triceramonSprite from 'figma:asset/91974d820051b34dd9e9db8f1b4f72ae1216ed98.png';
import tuskmonSprite from 'figma:asset/4545c1113c2742541bfa287e8aaad34d540d5188.png';
import ultimateBrachiomon from 'figma:asset/cfe5f78d2ba5745cf2fab94f2ea9e70d1b5bfc0a.png';
import gaioumonSprite from 'figma:asset/797dcc096094cec27969dafb7d0d37cddbe6a1d5.png';
import bakemonSprite from 'figma:asset/cc04120f94ce0a4ae081b26d2359ca0dd7488f6d.png';
import digitamamonSprite from 'figma:asset/15b86f9a6a117217f92fc8c35383b8ba7a68d995.png';
import gigadramonSprite from 'figma:asset/61935125c675c3d79b74bdfbb783563de187250a.png';
import titamonSprite from 'figma:asset/2289f0ba6bd5182e66b3253be305d6860dbe1148.png';
import gaioumonIttoSprite from 'figma:asset/2f5fefb3d68da3d20ef1d5195a8f0ddc506b1149.png';
// Veemon line
import chicomonSprite from 'figma:asset/4d2fa6b5f39afed1e868edf4c8faf3c4888ecc84.png';
import chibimonSprite from 'figma:asset/3b47f9d0035dbc50ffa6a78567bf904fc56834d6.png';
import veemonSprite from 'figma:asset/17701dd96050e16b1fac593a32079ae86e5bd531.png';
import exVeemonSprite from 'figma:asset/136cb8d464cc8d648c7de82119ca05f5c5396af5.png';
import paildramonSprite from 'figma:asset/bfde95df2c77e342ddcf05bd6a8480711ea5a740.png';
import imperialdramonSprite from 'figma:asset/701f6bc49c8ab4166c27d7c362af3194b202a330.png';
import veedramonSprite from 'figma:asset/dcf2429f06e823eb567e0018e2d2de9887b5c034.png';
import aeroVeedramonSprite from 'figma:asset/e276464f1870730b1e5cb5dfbed9d586df28d609.png';
import ulforceVeedramonSprite from 'figma:asset/7bdcafe95cc603bba49f20349fe242e981ddf8ec.png';
import flamedramonSprite from 'figma:asset/b75ac337773a9cbda275e4994894104282fe9943.png';
import raidramonSprite from 'figma:asset/4fc596d119266f4125b18733231e3f326f163b28.png';
import magnamonSprite from 'figma:asset/46ea13627a0da430619fa9e993f7d14bb613d5f8.png';
import imperialdramonPaladinSprite from 'figma:asset/8ad9573c77b42ea0708b5b29032a7489c7616571.png';
// Salamon line
import yukimibotamonSprite from 'figma:asset/eb90dd429719211430c96bfff0ab33ce4263dc33.png';
import nyaromonSprite from 'figma:asset/21c7ddc9f28cb93fb5e301b2bfb797ade7767403.png';
import plotmonSprite from 'figma:asset/acf058298d9eb6312c16c5f296a808c2f4edc163.png';
import gatomonSprite from 'figma:asset/cd6cdea0aaf4dea528d69cb4812333fe7980f034.png';
import angewomonSprite from 'figma:asset/91def178d3bb589f11cf012e72a30ed12f14ed5a.png';
import ophanimonSprite from 'figma:asset/0523e198a779637515f03904bb4baa992fdf837e.png';
import blackGatomonSprite from 'figma:asset/6597e8c17a1647c444bdc1d375da54f07b1e8d45.png';
import ladyDevimonSprite from 'figma:asset/6e5b9d1d2d1c049b40fcb76d3e31d0ed15713538.png';
import lilithmonSprite from 'figma:asset/4834d54b968cbf6223b91134a426afc867a9138a.png';
import mikemonSprite from 'figma:asset/79da08e63a9021eed7f83f46fafd43e36f1e30dd.png';
import nefertimonSprite from 'figma:asset/750c493568ac7846d39b203e8be583d896133c60.png';
import holyDramonSprite from 'figma:asset/829e91e67710908cd0cecd99b5b12163536d3926.png';
import mastemonSprite from 'figma:asset/a036d6071a61f5a7cde8ca604f58cd0267141481.png';

interface WidgetViewProps {
  variant: '1x1' | '1x8' | '2x8';
  energyLevel: number;
  message?: string;
  companionMood: 'idle' | 'happy' | 'tired';
  evolutionStage?: string;
  completedTasks?: number;
  totalTasks?: number;
}

export function WidgetView({ variant, energyLevel, message, companionMood, evolutionStage = 'tapirmon', completedTasks = 0, totalTasks = 0 }: WidgetViewProps) {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState<'right' | 'left'>('right');

  // Walking animation
  useEffect(() => {
    const speed = companionMood === 'happy' ? 0.5 : companionMood === 'tired' ? 0.15 : 0.3;
    const interval = setInterval(() => {
      setPosition(prev => {
        const newPos = direction === 'right' ? prev + speed : prev - speed;
        
        if (newPos >= 100) {
          setDirection('left');
          return 100;
        } else if (newPos <= 0) {
          setDirection('right');
          return 0;
        }
        
        return newPos;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [direction, companionMood]);

  const getSprite = () => {
    switch (evolutionStage.toLowerCase()) {
      case 'digiegg':
        return digiEggSprite;
      case 'pichimon':
        return pichimonSprite;
      case 'pukamon':
        return pukamonSprite;
      case 'tapirmon':
        return tapirmonSprite;
      case 'monochromon':
        return monochromon;
      case 'triceramon':
        return triceramonSprite;
      case 'tuskmon':
        return tuskmonSprite;
      case 'bakemon':
        return bakemonSprite;
      case 'digitamamon':
        return digitamamonSprite;
      case 'gigadramon':
        return gigadramonSprite;
      case 'ultimatebrachiomon':
        return ultimateBrachiomon;
      case 'gaioumon':
        return gaioumonSprite;
      case 'titamon':
        return titamonSprite;
      case 'gaioumon-itto':
        return gaioumonIttoSprite;
      // Veemon line
      case 'chicomon': return chicomonSprite;
      case 'chibimon': return chibimonSprite;
      case 'veemon': return veemonSprite;
      case 'exveemon': return exVeemonSprite;
      case 'paildramon': return paildramonSprite;
      case 'imperialdramon': return imperialdramonSprite;
      case 'veedramon': return veedramonSprite;
      case 'aeroveedramon': return aeroVeedramonSprite;
      case 'ulforceveedramon': return ulforceVeedramonSprite;
      case 'flamedramon': return flamedramonSprite;
      case 'raidramon': return raidramonSprite;
      case 'magnamon': return magnamonSprite;
      case 'imperialdramon-paladin': return imperialdramonPaladinSprite;
      // Salamon line
      case 'yukimibotamon': return yukimibotamonSprite;
      case 'nyaromon': return nyaromonSprite;
      case 'plotmon': return plotmonSprite;
      case 'gatomon': return gatomonSprite;
      case 'angewomon': return angewomonSprite;
      case 'ophanimon': return ophanimonSprite;
      case 'gatomon-black': return blackGatomonSprite;
      case 'ladydevimon': return ladyDevimonSprite;
      case 'lilithmon': return lilithmonSprite;
      case 'mikemon': return mikemonSprite;
      case 'nefertimon': return nefertimonSprite;
      case 'holydramon': return holyDramonSprite;
      case 'mastemon': return mastemonSprite;
      default:
        return digiEggSprite;
    }
  };

  const getCompanionFilter = () => {
    switch (companionMood) {
      case 'happy':
        return 'brightness-110 saturate-150 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]';
      case 'tired':
        return 'brightness-75 saturate-50 grayscale-[0.3]';
      default:
        return '';
    }
  };

  if (variant === '1x1') {
    return (
      <div className="bg-gray-500 rounded-lg p-2 border-2 border-gray-600 inline-block">
        <div 
          className="w-20 h-20 rounded border-2 border-gray-600 flex items-center justify-center relative overflow-hidden"
          style={{ 
            backgroundImage: `url(${bgCyberpunk})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'pixelated'
          }}
        >
          <div 
            className="absolute transition-all duration-100 ease-linear"
            style={{ 
              left: `${position}%`,
              transform: `translateX(-50%) ${direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`
            }}
          >
            <img 
              src={getSprite()} 
              alt="Companion"
              className={`w-12 h-12 object-contain ${getCompanionFilter()}`}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          {/* Task Counter - Top Left */}
          {totalTasks > 0 && (
            <div className="absolute top-1 left-1 bg-gray-800/80 rounded px-1 border border-gray-600">
              <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '0.5rem' }}>
                {completedTasks}/{totalTasks}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === '1x8') {
    return (
      <div className="w-64 bg-gray-500 rounded-lg p-2 border-2 border-gray-600 flex flex-col gap-2">
        <div 
          className="w-full h-20 rounded border-2 border-gray-600 relative overflow-hidden"
          style={{ 
            backgroundImage: `url(${bgCyberpunk})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'pixelated'
          }}
        >
          <div 
            className="absolute transition-all duration-100 ease-linear top-1/2 -translate-y-1/2"
            style={{ 
              left: `${position}%`,
              transform: `translate(-50%, -50%) ${direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`
            }}
          >
            <img 
              src={getSprite()} 
              alt="Companion"
              className={`w-14 h-14 object-contain ${getCompanionFilter()}`}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          {/* Task Counter - Top Left */}
          {totalTasks > 0 && (
            <div className="absolute top-1 left-1 bg-gray-800/80 rounded px-1.5 py-0.5 border border-gray-600">
              <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '0.5rem' }}>
                {completedTasks}/{totalTasks}
              </span>
            </div>
          )}
        </div>
        <div className="w-full bg-white rounded px-2 py-1.5 border border-gray-800">
          <p className="text-gray-800" style={{ fontFamily: 'monospace', fontSize: '0.625rem' }}>
            {message || "It's good to have you around!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-500 rounded-lg p-3 border-2 border-gray-600 flex flex-col gap-2">
      <div 
        className="w-full h-32 rounded border-2 border-gray-600 relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${bgCyberpunk})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated'
        }}
      >
        {/* Task Counter - Top Left */}
        {totalTasks > 0 && (
          <div className="absolute top-1 left-1 bg-gray-800/80 rounded px-1.5 py-0.5 border border-gray-600 z-10">
            <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '0.625rem' }}>
              {completedTasks}/{totalTasks}
            </span>
          </div>
        )}
        <div 
          className="absolute top-1/2 transition-all duration-100 ease-linear"
          style={{ 
            left: `${position}%`,
            transform: `translate(-50%, -50%) ${direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`
          }}
        >
          <img 
            src={getSprite()} 
            alt="Companion"
            className={`w-16 h-16 object-contain ${getCompanionFilter()}`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
      <div className="w-full bg-white rounded px-3 py-2 border-2 border-gray-800">
        <p className="text-gray-800 text-center" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {message || "It's good to have you around!"}
        </p>
      </div>
    </div>
  );
}
