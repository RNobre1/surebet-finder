interface SurebetsFiltersProps {
  sportFilter: string
  setSportFilter: (sport: string) => void
  minMarginFilter: number
  setMinMarginFilter: (margin: number) => void
  availableSports: string[]
}

export function SurebetsFilters({
  sportFilter,
  setSportFilter,
  minMarginFilter,
  setMinMarginFilter,
  availableSports,
}: SurebetsFiltersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Esporte</label>
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
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
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Margem de Lucro Mínima
        </label>
        <select
          value={minMarginFilter}
          onChange={(e) => setMinMarginFilter(Number(e.target.value))}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
        >
          <option value={0}>Qualquer Lucro ({'>'} 0%)</option>
          <option value={1}>Acima de 1%</option>
          <option value={2}>Acima de 2%</option>
          <option value={5}>Acima de 5%</option>
          <option value={10}>Acima de 10%</option>
        </select>
      </div>
    </div>
  )
}
