import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In a real app, you might want to log this to a crash reporting service
    // like Crashlytics or Sentry
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportError = () => {
    // In a real app, you would send this to your error reporting service
    console.log('Error reported:', this.state.error);
    alert('ขอบคุณสำหรับการรายงานปัญหา เราจะแก้ไขให้เร็วที่สุด');
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <LottieView
              source={require('../assets/animations/Error animation.json')}
              autoPlay
              loop
              style={styles.errorAnimation}
            />
            
            <Text style={styles.title}>เกิดข้อผิดพลาด</Text>
            <Text style={styles.subtitle}>
              ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด
            </Text>
            
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>
                {this.state.error && this.state.error.toString()}
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
              >
                <FontAwesome name="refresh" size={16} color="white" />
                <Text style={styles.buttonText}>ลองใหม่</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.reportButton]}
                onPress={this.handleReportError}
              >
                <FontAwesome name="bug" size={16} color="#FF8000" />
                <Text style={[styles.buttonText, styles.reportButtonText]}>
                  รายงานปัญหา
                </Text>
              </TouchableOpacity>
            </View>
            
            {__DEV__ && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    width: '100%',
    maxHeight: 150,
  },
  errorText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
  },
  reportButton: {
    backgroundColor: 'rgba(255, 128, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#FF8000',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  reportButtonText: {
    color: '#FF8000',
  },
  debugInfo: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;

