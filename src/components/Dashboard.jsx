import { useState } from 'react'
import ChartComponent from './Chart'
import SensorDataHandler from './SensorDataHandler'

// Define color constants to match the chart colors
const COLORS = {
	temperature: '#FFB3BA',
	humidity: '#B3E2CC',
	pressure: '#FFDF8C',
	gas: '#C6A3D1',
}

const Dashboard = () => {
	const [data, setData] = useState({
		temperature: '--',
		humidity: '--',
		pressure: '--',
		gas: '--',
		chartData: {
			temperature: [],
			humidity: [],
			pressure: [],
			gas: [],
		},
		stats: {
			temperature: { max: '--', min: '--', avg: '--' },
			humidity: { max: '--', min: '--', avg: '--' },
			pressure: { max: '--', min: '--', avg: '--' },
			gas: { max: '--', min: '--', avg: '--' },
		},
	})

	// Convert temperature to Fahrenheit
	const convertToFahrenheit = (celsius) => {
		if (celsius === '--') return '--'
		return ((parseFloat(celsius) * 9) / 5 + 32).toFixed(2)
	}

	return (
		<div className='dashboard'>
			<header className='dashboard-header'>
				<h1>Indoor Air Quality | BME680 Sensor Dashboard</h1>
			</header>

			<div className='cards-container'>
				{/* Current Readings */}
				<div className='card'>
					<h2 className='card-header'>Current Readings</h2>
					<div className='readings-grid'>
						<div className='reading-item'>
							<span>Temperature</span>
							<span style={{ color: COLORS.temperature }}>
								{data.temperature}°C / {convertToFahrenheit(data.temperature)}°F
							</span>
						</div>

						<div className='reading-item'>
							<span>Humidity</span>
							<span style={{ color: COLORS.humidity }}>{data.humidity}%</span>
						</div>

						<div className='reading-item'>
							<span>Pressure</span>
							<span style={{ color: COLORS.pressure }}>
								{data.pressure} hPa
							</span>
						</div>

						<div className='reading-item'>
							<span>Gas</span>
							<span style={{ color: COLORS.gas }}>{data.gas} Ω</span>
						</div>
					</div>
				</div>

				{/* Statistics */}
				<div className='card'>
					<h2 className='card-header'>Statistics</h2>
					<div className='stats-container'>
						{/* Temperature Stats */}
						<div className='stat-section'>
							<h3 style={{ color: COLORS.temperature }}>Temperature</h3>
							<div className='stats-grid'>
								<div className='stat-item'>
									<span>Average</span>
									<span>
										{data.stats.temperature.avg}°C /{' '}
										{convertToFahrenheit(data.stats.temperature.avg)}°F
									</span>
								</div>

								<div className='stat-item'>
									<span>Maximum</span>
									<span>
										{data.stats.temperature.max}°C /{' '}
										{convertToFahrenheit(data.stats.temperature.max)}°F
									</span>
								</div>

								<div className='stat-item'>
									<span>Minimum</span>
									<span>
										{data.stats.temperature.min}°C /{' '}
										{convertToFahrenheit(data.stats.temperature.min)}°F
									</span>
								</div>
							</div>
						</div>

						{/* Humidity Stats */}
						<div className='stat-section'>
							<h3 style={{ color: COLORS.humidity }}>Humidity</h3>
							<div className='stats-grid'>
								<div className='stat-item'>
									<span>Average</span>
									<span>{data.stats.humidity.avg}%</span>
								</div>

								<div className='stat-item'>
									<span>Maximum</span>
									<span>{data.stats.humidity.max}%</span>
								</div>

								<div className='stat-item'>
									<span>Minimum</span>
									<span>{data.stats.humidity.min}%</span>
								</div>
							</div>
						</div>

						{/* Pressure Stats */}
						<div className='stat-section'>
							<h3 style={{ color: COLORS.pressure }}>Pressure</h3>
							<div className='stats-grid'>
								<div className='stat-item'>
									<span>Average</span>
									<span>{data.stats.pressure.avg} hPa</span>
								</div>

								<div className='stat-item'>
									<span>Maximum</span>
									<span>{data.stats.pressure.max} hPa</span>
								</div>

								<div className='stat-item'>
									<span>Minimum</span>
									<span>{data.stats.pressure.min} hPa</span>
								</div>
							</div>
						</div>

						{/* Gas Stats */}
						<div className='stat-section'>
							<h3 style={{ color: COLORS.gas }}>Gas</h3>
							<div className='stats-grid'>
								<div className='stat-item'>
									<span>Average</span>
									<span>{data.stats.gas.avg} Ω</span>
								</div>

								<div className='stat-item'>
									<span>Maximum</span>
									<span>{data.stats.gas.max} Ω</span>
								</div>

								<div className='stat-item'>
									<span>Minimum</span>
									<span>{data.stats.gas.min} Ω</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Chart component */}
			<ChartComponent data={data} colors={COLORS} />

			{/* Place SensorDataHandler at the bottom of the page */}
			<SensorDataHandler setData={setData} />
		</div>
	)
}

export default Dashboard
