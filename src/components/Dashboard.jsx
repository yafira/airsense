import { useState } from 'react'
import ChartComponent from './Chart'
import MQTTClient from '../components/MQTT'
import '../styles/Dashboard.css'

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

	// Store readings for statistics and smoothing
	const [readings, setReadings] = useState({
		temperature: [],
		humidity: [],
		pressure: [],
		gas: [],
		timestamps: [],
	})

	// Smoothing factor (0-1): lower value = more smoothing
	const smoothingFactor = 0.4

	// Apply exponential moving average smoothing
	const smoothData = (newValue, dataArray) => {
		if (dataArray.length === 0) return newValue

		// Get last smoothed value
		const lastValue = dataArray[dataArray.length - 1]

		// Calculate smoothed value using EMA formula
		return smoothingFactor * newValue + (1 - smoothingFactor) * lastValue
	}

	// Add small random variation to make graphs more dynamic
	const addVariation = (value) => {
		// Add subtle random variation (±0.5% of the value)
		const variation = value * 0.005 * (Math.random() * 2 - 1)
		return value + variation
	}

	// Handle new MQTT messages
	const handleMQTTMessage = (message) => {
		console.log('MQTT Message received in Dashboard:', message)

		// Check if the message is valid and has the expected format
		if (!message || !message.isJson || !message.payload) {
			console.log('Invalid message format:', message)
			return
		}

		const sensorData = message.payload

		// Check if message has test flag and ignore if it does
		if (sensorData.test === true) {
			console.log('Ignoring test message')
			return
		}

		// Extract sensor data fields (adjust according to your actual payload structure)
		const temperature =
			typeof sensorData.temperature === 'number' ? sensorData.temperature : null
		const humidity =
			typeof sensorData.humidity === 'number' ? sensorData.humidity : null
		const pressure =
			typeof sensorData.pressure === 'number' ? sensorData.pressure : null
		// Gas might be labeled as gasResistance in your Arduino code
		const gas =
			typeof sensorData.gasResistance === 'number'
				? sensorData.gasResistance
				: typeof sensorData.gas === 'number'
				? sensorData.gas
				: null

		// Only proceed if we have at least one valid sensor reading
		if (
			temperature === null &&
			humidity === null &&
			pressure === null &&
			gas === null
		) {
			console.log(
				'No valid sensor readings found in the message payload:',
				sensorData
			)
			return
		}

		const timestamp = message.time || new Date()

		// Create copies of the current readings
		const updatedReadings = { ...readings }

		// Update each sensor reading if available
		if (temperature !== null) {
			const smoothedTemp = addVariation(
				smoothData(temperature, readings.temperature)
			)
			updatedReadings.temperature = [...readings.temperature, smoothedTemp]
		}

		if (humidity !== null) {
			const smoothedHumidity = addVariation(
				smoothData(humidity, readings.humidity)
			)
			updatedReadings.humidity = [...readings.humidity, smoothedHumidity]
		}

		if (pressure !== null) {
			const smoothedPressure = addVariation(
				smoothData(pressure, readings.pressure)
			)
			updatedReadings.pressure = [...readings.pressure, smoothedPressure]
		}

		if (gas !== null) {
			const smoothedGas = addVariation(smoothData(gas, readings.gas))
			updatedReadings.gas = [...readings.gas, smoothedGas]
		}

		// Add timestamp
		updatedReadings.timestamps = [...readings.timestamps, timestamp]

		// Keep last 100 readings
		if (updatedReadings.timestamps.length > 100) {
			Object.keys(updatedReadings).forEach((key) => {
				if (Array.isArray(updatedReadings[key])) {
					updatedReadings[key] = updatedReadings[key].slice(-100)
				}
			})
		}

		setReadings(updatedReadings)

		// Calculate statistics for available data
		const calculateStats = (values) => {
			if (!values || values.length === 0)
				return { max: '--', min: '--', avg: '--' }
			return {
				max: Math.max(...values).toFixed(2),
				min: Math.min(...values).toFixed(2),
				avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
			}
		}

		// Prepare chart data with timestamps
		const rawChartData = {
			temperature: updatedReadings.temperature.map((value, index) => ({
				x: updatedReadings.timestamps[
					Math.min(index, updatedReadings.timestamps.length - 1)
				],
				y: value,
			})),
			humidity: updatedReadings.humidity.map((value, index) => ({
				x: updatedReadings.timestamps[
					Math.min(index, updatedReadings.timestamps.length - 1)
				],
				y: value,
			})),
			pressure: updatedReadings.pressure.map((value, index) => ({
				x: updatedReadings.timestamps[
					Math.min(index, updatedReadings.timestamps.length - 1)
				],
				y: value,
			})),
			gas: updatedReadings.gas.map((value, index) => ({
				x: updatedReadings.timestamps[
					Math.min(index, updatedReadings.timestamps.length - 1)
				],
				y: value,
			})),
		}

		// Get latest values for display
		const latestTemp =
			updatedReadings.temperature.length > 0
				? updatedReadings.temperature[
						updatedReadings.temperature.length - 1
				  ].toFixed(2)
				: '--'

		const latestHumidity =
			updatedReadings.humidity.length > 0
				? updatedReadings.humidity[updatedReadings.humidity.length - 1].toFixed(
						2
				  )
				: '--'

		const latestPressure =
			updatedReadings.pressure.length > 0
				? updatedReadings.pressure[updatedReadings.pressure.length - 1].toFixed(
						2
				  )
				: '--'

		const latestGas =
			updatedReadings.gas.length > 0
				? updatedReadings.gas[updatedReadings.gas.length - 1].toFixed(2)
				: '--'

		// Update the dashboard data
		setData({
			temperature: latestTemp,
			humidity: latestHumidity,
			pressure: latestPressure,
			gas: latestGas,
			chartData: rawChartData,
			stats: {
				temperature: calculateStats(updatedReadings.temperature),
				humidity: calculateStats(updatedReadings.humidity),
				pressure: calculateStats(updatedReadings.pressure),
				gas: calculateStats(updatedReadings.gas),
			},
		})
	}

	// Convert temperature to Fahrenheit
	const convertToFahrenheit = (celsius) => {
		if (celsius === '--') return '--'
		return ((parseFloat(celsius) * 9) / 5 + 32).toFixed(2)
	}

	return (
		<div className='dashboard'>
			<header className='dashboard-header'>
				<h1>airsense | Indoor Air Quality using Adafruit BME680 Sensor</h1>
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

			{/* MQTT Client */}
			<MQTTClient onNewMessage={handleMQTTMessage} />
		</div>
	)
}

export default Dashboard
