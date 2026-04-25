import React from 'react';

const Index = () => {
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f0f0f0',
        color: '#333',
        fontFamily: 'Arial, sans-serif'
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ marginBottom: '20px' }}>Welcome to My Page</h1>
            <p>This is a simple React component with inline styles.</p>
        </div>
    );
};

export default Index;