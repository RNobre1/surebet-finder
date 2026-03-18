interface ValueBetsFiltersProps {
  sportFilter: string
  setSportFilter: (sport: string) => void
  bookmakerFilter: string
  setBookmakerFilter: (bookmaker: string) => void
  marketFilter: string
  setMarketFilter: (market: string) => void
  dateFrom: string
  setDateFrom: (date: string) => void
  dateTo: string
  setDateTo: (date: string) => void
  minEvFilter: number
  setMinEvFilter: (minEv: number) => void
  maxEvFilter: number
  setMaxEvFilter: (maxEv: number) => void
  minOddFilter: number
  setMinOddFilter: (minOdd: number) => void
  maxOddFilter: number
  setMaxOddFilter: (maxOdd: number) => void
  availableSports: string[]
  availableBookmakers: string[]
  availableMarkets: string[]
  maxEv: number
  maxOdd: number
  onReset: () => void
}

export function ValueBetsFilters({
  sportFilter,
  setSportFilter,
  bookmakerFilter,
  setBookmakerFilter,
  marketFilter,
  setMarketFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  minEvFilter,
  setMinEvFilter,
  maxEvFilter,
  setMaxEvFilter,
  minOddFilter,
  setMinOddFilter,
  maxOddFilter,
  setMaxOddFilter,
  availableSports,
  availableBookmakers,
  availableMarkets,
  maxEv,
  maxOdd,
  onReset,
}: ValueBetsFiltersProps) {
  return (
    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-4">
      {/* Row 1: Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Esporte</label>
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="All">Todos os Esportes</option>
            {availableSports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Casa de Apostas</label>
          <select
            value={bookmakerFilter}
            onChange={(e) => setBookmakerFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="All">Todas as Casas</option>
            {availableBookmakers.map((bookie) => (
              <option key={bookie} value={bookie}>
                {bookie}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Mercado</label>
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="All">Todos os Mercados</option>
            {availableMarkets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Data do Evento — De
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Data do Evento — Até
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Row 3: EV% Slider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-400">EV% Mínimo</label>
            <span className="text-xs font-mono font-bold text-purple-400">
              +{minEvFilter.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxEv > 0 ? maxEv : 30}
            step={0.5}
            value={minEvFilter}
            onChange={(e) => setMinEvFilter(Number(e.target.value))}
            className="w-full accent-purple-500 h-1.5 rounded cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>+0%</span>
            <span>+{maxEv > 0 ? maxEv : 30}%</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-400">EV% Máximo</label>
            <span className="text-xs font-mono font-bold text-purple-400">
              {maxEvFilter === Infinity || maxEvFilter >= (maxEv > 0 ? maxEv : 30)
                ? '∞'
                : `+${maxEvFilter.toFixed(1)}%`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxEv > 0 ? maxEv : 30}
            step={0.5}
            value={maxEvFilter === Infinity ? (maxEv > 0 ? maxEv : 30) : maxEvFilter}
            onChange={(e) => {
              const val = Number(e.target.value)
              const top = maxEv > 0 ? maxEv : 30
              setMaxEvFilter(val >= top ? Infinity : val)
            }}
            className="w-full accent-purple-500 h-1.5 rounded cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>+0%</span>
            <span>∞</span>
          </div>
        </div>
      </div>

      {/* Row 4: Odds Slider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-400">Odd Mínima</label>
            <span className="text-xs font-mono font-bold text-white">
              @{minOddFilter.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={1.0}
            max={maxOdd > 0 ? maxOdd : 10}
            step={0.05}
            value={minOddFilter}
            onChange={(e) => setMinOddFilter(Number(e.target.value))}
            className="w-full accent-purple-500 h-1.5 rounded cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>@1.00</span>
            <span>@{maxOdd > 0 ? maxOdd : 10}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-400">Odd Máxima</label>
            <span className="text-xs font-mono font-bold text-white">
              {maxOddFilter === Infinity || maxOddFilter >= (maxOdd > 0 ? maxOdd : 10)
                ? '∞'
                : `@${maxOddFilter.toFixed(2)}`}
            </span>
          </div>
          <input
            type="range"
            min={1.0}
            max={maxOdd > 0 ? maxOdd : 10}
            step={0.05}
            value={maxOddFilter === Infinity ? (maxOdd > 0 ? maxOdd : 10) : maxOddFilter}
            onChange={(e) => {
              const val = Number(e.target.value)
              const top = maxOdd > 0 ? maxOdd : 10
              setMaxOddFilter(val >= top ? Infinity : val)
            }}
            className="w-full accent-purple-500 h-1.5 rounded cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>@1.00</span>
            <span>∞</span>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <div className="flex justify-end pt-1">
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-white transition-colors underline underline-offset-2"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  )
}
