interface ValueBetsFiltersProps {
  sportFilter: string
  setSportFilter: (sport: string) => void
  bookmakerFilter: string
  setBookmakerFilter: (bookmaker: string) => void
  minEvFilter: number
  setMinEvFilter: (minEv: number) => void
  availableSports: string[]
  availableBookmakers: string[]
}

export function ValueBetsFilters({
  sportFilter,
  setSportFilter,
  bookmakerFilter,
  setBookmakerFilter,
  minEvFilter,
  setMinEvFilter,
  availableSports,
  availableBookmakers,
}: ValueBetsFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
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
        <label className="block text-xs font-medium text-slate-400 mb-1">EV Mínimo</label>
        <select
          value={minEvFilter}
          onChange={(e) => setMinEvFilter(Number(e.target.value))}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value={0}>Qualquer EV (+0%)</option>
          <option value={2}>Melhores que +2%</option>
          <option value={5}>Melhores que +5%</option>
          <option value={10}>Melhores que +10%</option>
        </select>
      </div>
    </div>
  )
}
