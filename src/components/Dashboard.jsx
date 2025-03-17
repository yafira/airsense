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

		// Check if message is JSON and has required fields
		if (!message.isJson) {
			console.error('Received non-JSON message:', message.payload)
			return
		}

		const sensorData = message.payload

		// Check for required sensor fields
		// Note: Adjust field names based on your Arduino code's actual output
		const temperature = sensorData.temperature
		const humidity = sensorData.humidity
		const pressure = sensorData.pressure
		// Gas might be labeled as gasResistance in your Arduino code
		const gas = sensorData.gasResistance || sensorData.gas

		if (
			typeof temperature !== 'number' ||
			typeof humidity !== 'number' ||
			typeof pressure !== 'number' ||
			typeof gas !== 'number'
		) {
			console.error('Invalid sensor data format:', sensorData)
			return
		}

		const timestamp = new Date()

		// Apply smoothing to the data and add subtle variation
		const smoothedTemp = addVariation(
			smoothData(temperature, readings.temperature)
		)
		const smoothedHumidity = addVariation(
			smoothData(humidity, readings.humidity)
		)
		const smoothedPressure = addVariation(
			smoothData(pressure, readings.pressure)
		)
		const smoothedGas = addVariation(smoothData(gas, readings.gas))

		// Update readings history
		const updatedReadings = {
			temperature: [...readings.temperature, smoothedTemp],
			humidity: [...readings.humidity, smoothedHumidity],
			pressure: [...readings.pressure, smoothedPressure],
			gas: [...readings.gas, smoothedGas],
			timestamps: [...readings.timestamps, timestamp],
		}

		// Keep last 100 readings
		if (updatedReadings.temperature.length > 100) {
			updatedReadings.temperature.shift()
			updatedReadings.humidity.shift()
			updatedReadings.pressure.shift()
			updatedReadings.gas.shift()
			updatedReadings.timestamps.shift()
		}

		setReadings(updatedReadings)

		// Calculate statistics
		const calculateStats = (values) => {
			if (values.length === 0) return { max: '--', min: '--', avg: '--' }
			return {
				max: Math.max(...values).toFixed(2),
				min: Math.min(...values).toFixed(2),
				avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
			}
		}

		// Prepare chart data with timestamps
		const rawChartData = {
			temperature: updatedReadings.temperature.map((value, index) => ({
				x: updatedReadings.timestamps[index],
				y: value,
			})),
			humidity: updatedReadings.humidity.map((value, index) => ({
				x: updatedReadings.timestamps[index],
				y: value,
			})),
			pressure: updatedReadings.pressure.map((value, index) => ({
				x: updatedReadings.timestamps[index],
				y: value,
			})),
			gas: updatedReadings.gas.map((value, index) => ({
				x: updatedReadings.timestamps[index],
				y: value,
			})),
		}

		// Update the dashboard data
		setData({
			temperature: smoothedTemp.toFixed(2),
			humidity: smoothedHumidity.toFixed(2),
			pressure: smoothedPressure.toFixed(2),
			gas: smoothedGas.toFixed(2),
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

			{/* MQTT Client - Keep this one and remove any others */}
			<MQTTClient onNewMessage={handleMQTTMessage} />
		</div>
	)
}

export default Dashboard
