import React from 'react'

export default function WeekList({ weeklyForecast, formatDay, describeWeather }) {
  return (
    <div className="week-list">
      {weeklyForecast.map((item) => {
        const [label, icon] = describeWeather(item.code)
        return (
          <article className="day-row" key={item.time} tabIndex="0">
            <div className="day-name">
              <strong>{formatDay(item.time)}</strong>
              <span>{label}</span>
            </div>
            <i className={`bi ${icon}`} aria-hidden="true"></i>
            <div className="day-meta">
              <span>{item.low} deg / {item.high} deg</span>
              <small>{item.rain}% rain - {item.wind} km/h</small>
            </div>
          </article>
        )
      })}
    </div>
  )
}
