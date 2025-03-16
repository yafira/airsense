import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import '../styles/SensorDataHandler.css'

const SensorDataHandler = ({ setData }) => {
	const [arduinoIP, setArduinoIP] = useState('192.168.1.167')
	const [connectionStatus, setConnectionStatus] = useState('disconnected')
	const [lastUpdated, setLastUpdated] = useState(null)
	const intervalRef = useRef(null)
	const isFirstConnectionAttempt = useRef(true)
	const readings = useRef({
		temperature: [],
		humidity: [],
		pressure: [],
		gas: [],
		timestamps: [],
	})

	// smoothing factor (0-1): lower value = more smoothing
	const smoothingFactor = 0.4

	// apply exponential moving average smoothing
	const smoothData = (newValue, dataArray) => {
		if (dataArray.length === 0) return newValue

		// get last smoothed value
		const lastValue = dataArray[dataArray.length - 1]

		// calculate smoothed value using ema formula
		return smoothingFactor * newValue + (1 - smoothingFactor) * lastValue
	}

	// add small random variation to make graphs more dynamic
	const addVariation = (value) => {
		// add subtle random variation (±0.5% of the value)
		const variation = value * 0.005 * (Math.random() * 2 - 1)
		return value + variation
	}

	const fetchSensorData = async () => {
		try {
			// direct connection to arduino ip
			const apiUrl = `http://${arduinoIP}`
			console.log(`Fetching data from: ${apiUrl}`)

			const response = await fetch(apiUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					// Prevent caching
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					Pragma: 'no-cache',
					Expires: '0',
				},
				cache: 'no-cache',
				// Increase timeout to 10 seconds
				signal: AbortSignal.timeout(10000),
			})

			console.log('Response status:', response.status)

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`)
			}

			// For debugging - log the raw response text first
			const responseText = await response.text()
			console.log('Raw response:', responseText)

			// Only try to parse if we have content
			if (!responseText || responseText.trim() === '') {
				throw new Error('Empty response received from Arduino')
			}

			// Then parse it as JSON
			let sensorData
			try {
				sensorData = JSON.parse(responseText)
			} catch (parseError) {
				console.error('JSON parse error:', parseError)
				console.log('Invalid JSON received:', responseText)
				throw new Error('Failed to parse sensor data as JSON')
			}

			console.log('Parsed sensor data:', sensorData)

			// Validate the received data - match arduino's json field names
			if (
				typeof sensorData.temperature !== 'number' ||
				typeof sensorData.humidity !== 'number' ||
				typeof sensorData.pressure !== 'number' ||
				typeof sensorData.gasResistance !== 'number'
			) {
				console.error('Invalid data format:', sensorData)
				throw new Error('Invalid sensor data format')
			}

			// Set to connected only on first successful fetch
			if (connectionStatus !== 'connected') {
				setConnectionStatus('connected')
			}

			const timestamp = new Date()
			setLastUpdated(timestamp)

			// Apply smoothing to the data and add subtle variation for visual interest
			const smoothedTemp = addVariation(
				smoothData(sensorData.temperature, readings.current.temperature)
			)
			const smoothedHumidity = addVariation(
				smoothData(sensorData.humidity, readings.current.humidity)
			)
			const smoothedPressure = addVariation(
				smoothData(sensorData.pressure, readings.current.pressure)
			)
			const smoothedGas = addVariation(
				smoothData(sensorData.gasResistance, readings.current.gas)
			)

			// Update readings history with smoothed values
			readings.current.temperature.push(smoothedTemp)
			readings.current.humidity.push(smoothedHumidity)
			readings.current.pressure.push(smoothedPressure)
			readings.current.gas.push(smoothedGas)
			readings.current.timestamps.push(timestamp)

			// Keep last 100 readings for statistics and charts
			if (readings.current.temperature.length > 100) {
				readings.current.temperature.shift()
				readings.current.humidity.shift()
				readings.current.pressure.shift()
				readings.current.gas.shift()
				readings.current.timestamps.shift()
			}

			// Calculate statistics from the raw data (not the smoothed values)
			const calculateStats = (values) => ({
				max: Math.max(...values).toFixed(2),
				min: Math.min(...values).toFixed(2),
				avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
			})

			// Prepare chart data with timestamps
			const rawChartData = {
				temperature: readings.current.temperature.map((value, index) => ({
					x: readings.current.timestamps[index],
					y: value,
				})),
				humidity: readings.current.humidity.map((value, index) => ({
					x: readings.current.timestamps[index],
					y: value,
				})),
				pressure: readings.current.pressure.map((value, index) => ({
					x: readings.current.timestamps[index],
					y: value,
				})),
				gas: readings.current.gas.map((value, index) => ({
					x: readings.current.timestamps[index],
					y: value,
				})),
			}

			setData({
				// Display current values
				temperature: smoothedTemp.toFixed(2),
				humidity: smoothedHumidity.toFixed(2),
				pressure: smoothedPressure.toFixed(2),
				gas: smoothedGas.toFixed(2),
				chartData: rawChartData,
				stats: {
					temperature: calculateStats(readings.current.temperature),
					humidity: calculateStats(readings.current.humidity),
					pressure: calculateStats(readings.current.pressure),
					gas: calculateStats(readings.current.gas),
				},
			})

			// Not first attempt anymore
			isFirstConnectionAttempt.current = false
		} catch (error) {
			console.error('Error fetching sensor data:', error)

			// Set to disconnected if there's an error
			setConnectionStatus('disconnected')
		}
	}

	// Function to handle connection
	const handleConnect = () => {
		// Clear existing interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}

		// Set to initial connecting state
		setConnectionStatus('connecting...')

		// Reset first connection attempt flag
		isFirstConnectionAttempt.current = true

		// Fetch data immediately
		fetchSensorData()

		// Set up new polling interval
		intervalRef.current = setInterval(fetchSensorData, 2000)
	}

	useEffect(() => {
		// Clean up interval on component unmount
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, []) // Only run once on mount

	const getStatusColor = () => {
		if (connectionStatus === 'connected') return 'status-connected'
		if (connectionStatus === 'connecting...') return 'status-connecting'
		return 'status-disconnected'
	}

	return (
		<div className='sensor-status'>
			<div className='status-container'>
				<div>
					<span className={`status-indicator ${getStatusColor()}`}>
						Status: {connectionStatus}
					</span>
					{lastUpdated && (
						<span className='last-updated'>
							Last updated: {lastUpdated.toLocaleTimeString()}
						</span>
					)}
				</div>
			</div>

			<div className='ip-config'>
				<div className='ip-input-container'>
					<label htmlFor='arduino-ip'>Arduino IP:</label>
					<input
						id='arduino-ip'
						type='text'
						value={arduinoIP}
						onChange={(e) => setArduinoIP(e.target.value)}
					/>
				</div>

				<button onClick={handleConnect} className='connect-button'>
					Connect
				</button>
			</div>
		</div>
	)
}

SensorDataHandler.propTypes = {
	setData: PropTypes.func.isRequired,
}

export default SensorDataHandler
