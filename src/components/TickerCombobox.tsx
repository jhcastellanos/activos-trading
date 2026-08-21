import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  FEASIBILITY_TICKER_CATALOG,
  FEASIBILITY_TICKER_GROUP_LABELS,
  filterFeasibilityTickers,
  findFeasibilityTicker,
  tickerLogoUrl,
  type FeasibilityTickerGroup,
  type FeasibilityTickerOption,
} from '../business/feasibilityTickerCatalog'

type TickerComboboxProps = {
  value: string
  onChange: (symbol: string) => void
  options?: FeasibilityTickerOption[]
  label?: string
}

function TickerLogo({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const normalized = symbol.trim().toUpperCase()

  if (!normalized || failed) {
    return (
      <span
        className="ticker-logo ticker-logo-fallback"
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
        aria-hidden
      >
        {normalized.slice(0, 2) || '?'}
      </span>
    )
  }

  return (
    <img
      className="ticker-logo"
      src={tickerLogoUrl(normalized)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

const GROUP_ORDER: FeasibilityTickerGroup[] = ['mag7', 'featured', 'leveraged2x']

export function TickerCombobox({
  value,
  onChange,
  options = FEASIBILITY_TICKER_CATALOG,
  label = 'Ticker',
}: TickerComboboxProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [highlight, setHighlight] = useState(0)

  useEffect(() => {
    if (!open) setQuery(value)
  }, [value, open])

  const filtered = useMemo(() => filterFeasibilityTickers(query, options), [query, options])

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      label: FEASIBILITY_TICKER_GROUP_LABELS[group],
      items: filtered.filter((item) => item.group === group),
    })).filter((section) => section.items.length > 0)
  }, [filtered])

  const flatFiltered = useMemo(
    () => grouped.flatMap((section) => section.items),
    [grouped],
  )

  useEffect(() => {
    setHighlight(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const selected = findFeasibilityTicker(value, options)
  const displaySymbol = value.trim().toUpperCase()

  const pick = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase()
    onChange(normalized)
    setQuery(normalized)
    setOpen(false)
    inputRef.current?.blur()
  }

  const onInputChange = (next: string) => {
    const normalized = next.toUpperCase()
    setQuery(normalized)
    onChange(normalized)
    setOpen(true)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlight((prev) => Math.min(prev + 1, Math.max(flatFiltered.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((prev) => Math.max(prev - 1, 0))
      return
    }
    if (event.key === 'Enter' && open && flatFiltered[highlight]) {
      event.preventDefault()
      pick(flatFiltered[highlight].symbol)
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  let optionIndex = -1

  return (
    <div className="ticker-combobox" ref={rootRef}>
      <label className="cc-field cc-field-full">
        <span className="cc-field-label">{label}</span>
        <div className={`ticker-combobox-control${open ? ' open' : ''}`}>
          {displaySymbol ? <TickerLogo symbol={displaySymbol} size={24} /> : null}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={query}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="ticker-combobox-toggle"
            aria-label={open ? 'Cerrar lista de tickers' : 'Abrir lista de tickers'}
            onClick={() => {
              setOpen((prev) => !prev)
              inputRef.current?.focus()
            }}
          >
            ▾
          </button>
        </div>
        {selected && !open ? (
          <span className="ticker-combobox-selected-name">{selected.name}</span>
        ) : null}
      </label>

      {open && (
        <ul className="ticker-combobox-list" id={listboxId} role="listbox">
          {flatFiltered.length === 0 ? (
            <li className="ticker-combobox-empty">
              {query.trim()
                ? `Usar ticker personalizado: ${query.trim().toUpperCase()}`
                : 'Escribe o elige un ticker'}
            </li>
          ) : (
            grouped.map((section) => (
              <li key={section.group} className="ticker-combobox-group" role="presentation">
                <span className="ticker-combobox-group-label">{section.label}</span>
                <ul className="ticker-combobox-group-list" role="group">
                  {section.items.map((item) => {
                    optionIndex += 1
                    const idx = optionIndex
                    const active = idx === highlight
                    return (
                      <li key={item.symbol} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={value === item.symbol}
                          className={`ticker-combobox-option${active ? ' active' : ''}${value === item.symbol ? ' selected' : ''}`}
                          onMouseEnter={() => setHighlight(idx)}
                          onClick={() => pick(item.symbol)}
                        >
                          <TickerLogo symbol={item.symbol} size={28} />
                          <span className="ticker-combobox-option-text">
                            <strong>{item.symbol}</strong>
                            <span>
                              {item.name}
                              {item.baseSymbol ? ` · 2X ${item.baseSymbol}` : ''}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
