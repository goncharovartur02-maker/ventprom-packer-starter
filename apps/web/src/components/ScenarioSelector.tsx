import React, { useState } from 'react';

interface ScenarioSelectorProps {
  onSelect: (scenario: string) => void;
}

export default function ScenarioSelector({ onSelect }: ScenarioSelectorProps) {
  const [selected, setSelected] = useState('balanced');
  
  const scenarios = [
    {
      id: 'vehicles',
      name: 'Минимум машин',
      icon: '🚚',
      description: 'Минимизировать количество транспорта',
      details: 'Оптимизирует плотность упаковки для сокращения расходов на логистику'
    },
    {
      id: 'safety',
      name: 'Максимальная безопасность',
      icon: '🛡️',
      description: 'Безопасная транспортировка',
      details: 'Оптимальное распределение веса и низкий центр тяжести'
    },
    {
      id: 'fragile',
      name: 'Защита хрупких',
      icon: '💎',
      description: 'Защита оцинкованных воздуховодов',
      details: 'Размещение хрупких элементов в верхних слоях с дополнительной защитой'
    },
    {
      id: 'unloading',
      name: 'Быстрая разгрузка',
      icon: '⚡',
      description: 'Оптимальный порядок разгрузки',
      details: 'Минимальное количество слоев и удобный доступ к элементам'
    },
    {
      id: 'balanced',
      name: 'Сбалансированный',
      icon: '⚖️',
      description: 'Баланс всех параметров',
      details: 'Компромиссное решение для большинства задач'
    }
  ];
  
  const handleSelect = (scenarioId: string) => {
    setSelected(scenarioId);
    onSelect(scenarioId);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          🎯 Выберите приоритет упаковки
        </h3>
        <p className="text-white/70 text-sm">
          Система автоматически выберет оптимальный алгоритм упаковки
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => handleSelect(scenario.id)}
            className={`
              group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105
              ${selected === scenario.id
                ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
              }
            `}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="text-4xl mb-1 group-hover:scale-110 transition-transform duration-300">
                {scenario.icon}
              </div>
              
              <div>
                <div className="font-semibold text-white text-lg">
                  {scenario.name}
                </div>
                <div className="text-sm text-white/70 mt-1">
                  {scenario.description}
                </div>
                <div className="text-xs text-white/50 mt-2 leading-relaxed">
                  {scenario.details}
                </div>
              </div>
              
              {selected === scenario.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {selected && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {scenarios.find(s => s.id === selected)?.icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                Выбран режим: {scenarios.find(s => s.id === selected)?.name}
              </div>
              <div className="text-xs text-white/70">
                {scenarios.find(s => s.id === selected)?.details}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
        <div className="flex items-start space-x-3">
          <div className="text-xl">💡</div>
          <div className="text-sm text-white/80">
            <div className="font-semibold mb-1">Умная система анализа</div>
            <div className="text-xs text-white/60 leading-relaxed">
              Система автоматически проанализирует все варианты упаковки и выберет оптимальный, 
              учитывая ваши приоритеты, типы воздуховодов и характеристики транспорта.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Дополнительный компонент для отображения результатов анализа
export function ScenarioResults({ scenarioData }: { scenarioData: any }) {
  if (!scenarioData) return null;
  
  const { name, description, metrics, warnings, recommendations, allScenarios } = scenarioData;
  
  return (
    <div className="space-y-4 mt-6">
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="text-2xl">🎯</div>
          <div>
            <div className="font-semibold text-white">Выбранный сценарий: {name}</div>
            <div className="text-sm text-white/70">{description}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-400">{metrics.vehiclesUsed}</div>
            <div className="text-xs text-white/70">Машин</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-green-400">{metrics.stabilityScore.toFixed(0)}/100</div>
            <div className="text-xs text-white/70">Стабильность</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-400">{metrics.avgUtilization.toFixed(0)}%</div>
            <div className="text-xs text-white/70">Загрузка</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-orange-400">{metrics.fragileProtectionScore.toFixed(0)}/100</div>
            <div className="text-xs text-white/70">Защита хрупких</div>
          </div>
        </div>
      </div>
      
      {warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="font-semibold text-yellow-400 mb-2">⚠️ Предупреждения</div>
          <ul className="space-y-1 text-sm text-white/80">
            {warnings.map((warning: string, index: number) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="font-semibold text-blue-400 mb-2">💡 Рекомендации</div>
          <ul className="space-y-1 text-sm text-white/80">
            {recommendations.map((rec: string, index: number) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
      
      {allScenarios && allScenarios.length > 1 && (
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="font-semibold text-white mb-3">📊 Альтернативные сценарии</div>
          <div className="space-y-2">
            {allScenarios.slice(1).map((scenario: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm bg-white/5 rounded p-2">
                <span className="text-white/80">{scenario.name}</span>
                <div className="flex space-x-4 text-xs text-white/60">
                  <span>Машин: {scenario.vehiclesUsed}</span>
                  <span>Стабильность: {scenario.stabilityScore.toFixed(0)}</span>
                  <span>Загрузка: {scenario.utilization.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
