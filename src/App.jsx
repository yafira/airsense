import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import MQTTClient from './components/MQTT'

const App = () => {
	const [receivedMqttData, setReceivedMqttData] = useState(null)

	// This function gets called when a new MQTT message arrives
	const handleNewMqttMessage = (message) => {
		setReceivedMqttData(message)

		// If the message contains sensor data, you could parse it here
		// and pass it to your Dashboard component if needed
		console.log('New MQTT message received:', message)
	}

	return (
		<div className='app-container'>
			{/* Your existing Dashboard */}
			<Dashboard />

			{/* MQTT Client component */}
			<MQTTClient onNewMessage={handleNewMqttMessage} />
		</div>
	)
}

export default App
