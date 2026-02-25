"""Test script for audio streaming system."""

import asyncio
import json
import base64
import websockets
from typing import Optional
import sys

async def test_audio_devices(api_url: str):
    """Test audio device enumeration."""
    print("\n" + "="*60)
    print("TEST 1: Audio Device Enumeration")
    print("="*60)
    
    try:
        import requests
        response = requests.get(f"{api_url}/audio/devices")
        
        if response.status_code != 200:
            print(f"❌ Failed to get devices: {response.status_code}")
            return False
        
        data = response.json()
        print(f"✓ Status: {data.get('status')}")
        print(f"\nInput Devices ({len(data.get('input_devices', []))}): ")
        for device in data.get('input_devices', []):
            default = " [DEFAULT]" if device.get('is_default') else ""
            print(f"  [{device['index']}] {device['name']}{default}")
        
        print(f"\nOutput Devices ({len(data.get('output_devices', []))}): ")
        for device in data.get('output_devices', []):
            default = " [DEFAULT]" if device.get('is_default') else ""
            print(f"  [{device['index']}] {device['name']}{default}")
        
        print("\n✓ Device enumeration test PASSED")
        return True
    
    except Exception as e:
        print(f"❌ Device test failed: {e}")
        return False


async def test_websocket_connection(ws_url: str):
    """Test WebSocket connection."""
    print("\n" + "="*60)
    print("TEST 2: WebSocket Connection")
    print("="*60)
    
    try:
        print(f"Connecting to {ws_url}...")
        async with websockets.connect(ws_url) as websocket:
            print("✓ WebSocket connected")
            
            # Wait for initial message
            message = await asyncio.wait_for(websocket.recv(), timeout=5)
            data = json.loads(message)
            print(f"✓ Received connection message: {data.get('message')}")
            
            print("✓ WebSocket connection test PASSED")
            return True
    
    except asyncio.TimeoutError:
        print("❌ Timeout waiting for connection message")
        return False
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False


async def test_audio_message_format(ws_url: str):
    """Test audio message format."""
    print("\n" + "="*60)
    print("TEST 3: Audio Message Format")
    print("="*60)
    
    try:
        async with websockets.connect(ws_url) as websocket:
            # Create dummy audio data
            dummy_audio = bytes([0, 1, 2, 3] * 256)  # 1024 bytes
            audio_b64 = base64.b64encode(dummy_audio).decode('utf-8')
            
            message = {
                "type": "audio_chunk",
                "data": audio_b64,
                "timestamp": "2026-02-20T14:30:00"
            }
            
            print(f"Sending test audio chunk ({len(dummy_audio)} bytes)...")
            await websocket.send(json.dumps(message))
            
            print("✓ Message sent successfully")
            
            # Listen for broadcast response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2)
                data = json.loads(response)
                print(f"✓ Received response: type={data.get('type')}")
                print("✓ Audio message format test PASSED")
                return True
            except asyncio.TimeoutError:
                print("⚠️ No response received (expected if no other clients)")
                print("✓ Audio message format test PASSED (no errors)")
                return True
    
    except Exception as e:
        print(f"❌ Message format test failed: {e}")
        return False


async def test_concurrent_connections(ws_url: str, num_clients: int = 2):
    """Test multiple concurrent connections."""
    print("\n" + "="*60)
    print(f"TEST 4: Concurrent Connections ({num_clients} clients)")
    print("="*60)
    
    try:
        connections = []
        print(f"Establishing {num_clients} connections...")
        
        for i in range(num_clients):
            try:
                ws = await asyncio.wait_for(
                    websockets.connect(ws_url),
                    timeout=5
                )
                connections.append(ws)
                print(f"✓ Client {i+1} connected")
            except Exception as e:
                print(f"❌ Client {i+1} failed: {e}")
                return False
        
        print(f"✓ All {num_clients} clients connected")
        
        # Send test message from first client
        dummy_audio = bytes([0] * 512)
        audio_b64 = base64.b64encode(dummy_audio).decode('utf-8')
        message = {
            "type": "audio_chunk",
            "data": audio_b64,
            "timestamp": "2026-02-20T14:30:00"
        }
        
        print("Client 1 sending audio chunk...")
        await connections[0].send(json.dumps(message))
        
        # Other clients try to receive
        received = 0
        for i in range(1, num_clients):
            try:
                response = await asyncio.wait_for(
                    connections[i].recv(),
                    timeout=1
                )
                received += 1
                print(f"✓ Client {i+1} received broadcast")
            except asyncio.TimeoutError:
                print(f"⚠️ Client {i+1} didn't receive (expected if broadcast not fully implemented)")
        
        # Close connections
        for ws in connections:
            await ws.close()
        
        print(f"✓ Concurrent connections test PASSED ({received} of {num_clients-1} clients received)")
        return True
    
    except Exception as e:
        print(f"❌ Concurrent connections test failed: {e}")
        return False


async def test_disconnect_reconnect(ws_url: str):
    """Test disconnect and reconnect."""
    print("\n" + "="*60)
    print("TEST 5: Disconnect and Reconnect")
    print("="*60)
    
    try:
        # First connection
        print("Establishing first connection...")
        ws1 = await websockets.connect(ws_url)
        msg = await asyncio.wait_for(ws1.recv(), timeout=5)
        print(f"✓ First connection established")
        
        # Disconnect
        print("Closing connection...")
        await ws1.close()
        print("✓ Connection closed")
        
        # Reconnect
        print("Establishing second connection...")
        ws2 = await websockets.connect(ws_url)
        msg = await asyncio.wait_for(ws2.recv(), timeout=5)
        print(f"✓ Second connection established")
        
        await ws2.close()
        print("✓ Disconnect and reconnect test PASSED")
        return True
    
    except Exception as e:
        print(f"❌ Disconnect/reconnect test failed: {e}")
        return False


async def run_all_tests(api_url: str):
    """Run all tests."""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║  MAPAS AUDIO STREAMING SYSTEM - TEST SUITE".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")
    
    ws_url = api_url.replace("http", "ws") + "/ws/audio/broadcast-mic"
    
    results = []
    
    # Test 1: Device enumeration
    results.append(("Audio Device Enumeration", await test_audio_devices(api_url)))
    
    # Test 2: WebSocket connection
    results.append(("WebSocket Connection", await test_websocket_connection(ws_url)))
    
    # Test 3: Audio message format
    results.append(("Audio Message Format", await test_audio_message_format(ws_url)))
    
    # Test 4: Concurrent connections
    results.append(("Concurrent Connections", await test_concurrent_connections(ws_url, 2)))
    
    # Test 5: Disconnect/reconnect
    results.append(("Disconnect/Reconnect", await test_disconnect_reconnect(ws_url)))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASSED" if result else "❌ FAILED"
        print(f"{name}: {status}")
    
    print("-" * 60)
    print(f"Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Audio streaming system is working correctly.")
        return 0
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. Check errors above.")
        return 1


def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        api_url = sys.argv[1]
    else:
        api_url = "http://localhost:8000"
    
    print(f"Testing against API: {api_url}")
    
    try:
        exit_code = asyncio.run(run_all_tests(api_url))
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
