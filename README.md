# AirSense 💨

AirSense is a React-based application that displays real-time environmental sensor data, including temperature, humidity, pressure, and gas readings, collected from an Adafruit BME680 sensor. The application visualizes the sensor data using dynamic charts powered by Chart.js.

## Features

- **Real-time Data**: Displays live environmental data from the BME680 sensor, including temperature, humidity, pressure, and gas readings.
- **Dynamic Visualization**: Uses Chart.js to provide interactive, real-time charts of sensor data over time.
- **Responsive Design**: The app is fully responsive, making it suitable for viewing on a variety of devices.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **Chart.js**: A charting library for creating responsive, dynamic charts.
- **Adafruit BME680**: A sensor used to measure temperature, humidity, pressure, and gas levels in the environment. The BME680 is a powerful environmental sensor with a range of applications, including air quality monitoring, weather stations, and smart home systems.

## About the BME680 Sensor

The **Adafruit BME680** is an environmental sensor that measures the following:

- **Temperature**: Measures ambient temperature in Celsius (°C) (however, it's displayed in Fahrenheit (°F) as well).
- **Humidity**: Measures the humidity level in the air, represented as a percentage (%).
- **Pressure**: Measures atmospheric pressure in hectopascals (hPa).
- **Gas**: Detects the presence of gases in the air, typically used for air quality measurement, with a focus on volatile organic compounds (VOCs).

The BME680 uses a gas sensor to detect a wide range of gases, providing a comprehensive understanding of the air quality in the surrounding environment. The sensor's data is updated in real time, making it perfect for applications that require continuous monitoring of environmental conditions.

### Key Features of the BME680:

- **Temperature range**: -40°C to +85°C
- **Humidity range**: 0% to 100% RH
- **Pressure range**: 300 hPa to 1100 hPa
- **Gas resistance range**: 1 to 1,000,000 Ohms

This sensor is often used in various applications like indoor air quality monitoring, smart weather stations, and home automation systems.

## Installation

To run the AirSense app locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/airsense.git
   ```

2. Navigate to the project directory:

   ```bash
   cd airsense
   ```

3. Install the required dependencies:

   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The app should now be running locally on `http://localhost:3000`.

## Usage

Once the app is running, you will see real-time environmental data being displayed in interactive charts. The charts update as new data is received from the BME680 sensor.

You can toggle the visibility of different datasets (temperature, humidity, pressure, and gas) using the provided buttons below the chart. Each dataset is displayed as a line graph with different colors for easy identification.
