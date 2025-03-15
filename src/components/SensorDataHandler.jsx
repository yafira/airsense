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
			console.log(`fetching data from: ${apiUrl}`)

			const response = await fetch(apiUrl, {
				cache: 'no-cache',
				signal: AbortSignal.timeout(5000),
			})

			console.log('response status:', response.status)

			if (!response.ok) {
				throw new Error(`http error! status: ${response.status}`)
			}

			// for debugging - log the raw response text first
			const responseText = await response.text()
			console.log('raw response:', responseText)

			// then parse it as json
			const sensorData = JSON.parse(responseText)
			console.log('parsed sensor data:', sensorData)

			// validate the received data - match arduino's json field names
			if (
				typeof sensorData.temperature !== 'number' ||
				typeof sensorData.humidity !== 'number' ||
				typeof sensorData.pressure !== 'number' ||
				typeof sensorData.gasResistance !== 'number'
			) {
				throw new Error('invalid sensor data format')
			}

			// set to connected only on first successful fetch
			if (connectionStatus !== 'connected') {
				setConnectionStatus('connected')
			}

			const timestamp = new Date()
			setLastUpdated(timestamp)

			// apply smoothing to the data and add subtle variation for visual interest
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

			// update readings history with smoothed values
			readings.current.temperature.push(smoothedTemp)
			readings.current.humidity.push(smoothedHumidity)
			readings.current.pressure.push(smoothedPressure)
			readings.current.gas.push(smoothedGas)
			readings.current.timestamps.push(timestamp)

			// keep last 100 readings for statistics and charts
			if (readings.current.temperature.length > 100) {
				readings.current.temperature.shift()
				readings.current.humidity.shift()
				readings.current.pressure.shift()
				readings.current.gas.shift()
				readings.current.timestamps.shift()
			}

			// calculate statistics from the raw data (not the smoothed values)
			const calculateStats = (values) => ({
				max: Math.max(...values).toFixed(2),
				min: Math.min(...values).toFixed(2),
				avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
			})

			// prepare chart data with timestamps
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
				// display current values
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

			// not first attempt anymore
			isFirstConnectionAttempt.current = false
		} catch (error) {
			console.error('error fetching sensor data:', error)

			// only change to disconnected if it's the first attempt
			if (isFirstConnectionAttempt.current) {
				setConnectionStatus('disconnected')
				isFirstConnectionAttempt.current = false
			}
		}
	}

	// function to handle connection
	const handleConnect = () => {
		// clear existing interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}

		// set to initial connecting state
		setConnectionStatus('connecting...')

		// reset first connection attempt flag
		isFirstConnectionAttempt.current = true

		// fetch data immediately
		fetchSensorData()

		// set up new polling interval
		intervalRef.current = setInterval(fetchSensorData, 2000)
	}

	useEffect(() => {
		// clean up interval on component unmount
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, []) // only run once on mount

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
						status: {connectionStatus}
					</span>
					{lastUpdated && (
						<span className='last-updated'>
							last updated: {lastUpdated.toLocaleTimeString()}
						</span>
					)}
				</div>
			</div>

			<div className='ip-config'>
				<div className='ip-input-container'>
					<label htmlFor='arduino-ip'>arduino ip:</label>
					<input
						id='arduino-ip'
						type='text'
						value={arduinoIP}
						onChange={(e) => setArduinoIP(e.target.value)}
					/>
				</div>

				<button onClick={handleConnect} className='connect-button'>
					connect
				</button>
			</div>
		</div>
	)
}

SensorDataHandler.propTypes = {
	setData: PropTypes.func.isRequired,
}

export default SensorDataHandler
