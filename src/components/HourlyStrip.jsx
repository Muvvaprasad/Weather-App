import React from 'react'

export default function HourlyStrip({ hourlyForecast, formatHour, describeWeather }) {
  return (
    <div className="hourly-strip">
      {hourlyForecast.map((item) => {
        const [label, icon] = describeWeather(item.code)
        return (
          <article className="hour-card" key={item.time} title={label}>
            <span>{formatHour(item.time)}</span>
            <i className={`bi ${icon}`} aria-hidden="true"></i>
            <strong>{item.temperature} deg</strong>
            <small>{item.rain}% rain</small>
          </article>
        )
      })}
    </div>
  )
}
