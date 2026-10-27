import React from 'react';

interface FozLogoProps {
  className?: string;
  iconOnly?: boolean;
  light?: boolean;
  showSubtitle?: boolean;
}

export const FozLogo: React.FC<FozLogoProps> = ({
  className = 'h-9',
  iconOnly = false,
  light = false,
  showSubtitle = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 sm:gap-3 select-none ${className}`}>
      {/* Official FozSistemas Company Logo Image */}
      <div
        className={`h-full shrink-0 flex items-center justify-center transition-all ${
          light
            ? 'bg-white/95 p-1 rounded-lg shadow-xs'
            : 'dark:bg-white/95 dark:p-1 dark:rounded-lg dark:shadow-xs'
        }`}
      >
        <img
          src="/assets/aistudio/logo-fozsistemas_73ab3b0a.png"
          alt="FozSistemas"
          className="h-full w-auto max-h-10 sm:max-h-12 object-contain"
        />
      </div>

      {!iconOnly && (
        <div className="flex flex-col text-left leading-none justify-center min-w-0">
          {/* Marca & Nome Comercial */}
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-base sm:text-lg font-sans ${
                light ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            >
              FSYS<span className="text-red-600 dark:text-red-500">360</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-red-600 text-white shadow-2xs">
              Service
            </span>
          </div>

          {/* Descrição & Empresa (oculto em ecrãs móveis estreitos para evitar desfasamento visual) */}
          {showSubtitle && (
            <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] font-medium tracking-normal ${
                  light ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Gestão de Assistências Técnicas
              </span>
              <span className={`text-[10px] ${light ? 'text-slate-500' : 'text-slate-300 dark:text-slate-600'}`}>•</span>
              <span
                className={`text-[10px] font-semibold tracking-wide ${
                  light ? 'text-red-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                FozSistemas
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
