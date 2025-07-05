#!/bin/bash

# Test complet de tous les endpoints de l'API
# Ce script teste chaque endpoint individuel pour s'assurer qu'ils existent tous

echo "🧪 === TEST COMPLET DE TOUS LES ENDPOINTS ==="
echo "Testing API at: http://localhost:3000/api/v1"
echo

BASE_URL="http://localhost:3000/api/v1"
PASSED=0
FAILED=0

# Fonction pour tester un endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    echo -n "Testing $method $endpoint - $description ... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo "✅ PASS ($status)"
        ((PASSED++))
    else
        echo "❌ FAIL ($status)"
        ((FAILED++))
    fi
}

echo "🔐 === AUTHENTICATION ENDPOINTS ==="
test_endpoint "POST" "/auth/register" '{"email":"test_user_'$(date +%s)'@example.com","password":"Test123!","firstName":"Test","lastName":"User"}' "Register"

# Special test for login to capture cookies
echo -n "Testing POST /auth/login - Login with admin ... "
response=$(curl -s -w "\n%{http_code}" -c cookies.txt -X "POST" "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin1234"}' 2>/dev/null)
status=$(echo "$response" | tail -n 1)
if [ "$status" = "200" ] || [ "$status" = "201" ]; then
    echo "✅ PASS ($status)"
    ((PASSED++))
else
    echo "❌ FAIL ($status)"
    ((FAILED++))
fi

# Special test for refresh token using captured cookies
echo -n "Testing POST /auth/refresh - Refresh token ... "
response=$(curl -s -w "\n%{http_code}" -b cookies.txt -X "POST" "$BASE_URL/auth/refresh" 2>/dev/null)
status=$(echo "$response" | tail -n 1)
if [ "$status" = "200" ] || [ "$status" = "201" ]; then
    echo "✅ PASS ($status)"
    ((PASSED++))
else
    echo "❌ FAIL ($status)"
    ((FAILED++))
fi
echo

echo "👥 === USERS ENDPOINTS ==="
test_endpoint "GET" "/users" "" "List users"
test_endpoint "POST" "/users" '{"email":"admin_created_'$(date +%s)'@test.com","password":"Admin123!","firstName":"Admin","lastName":"User"}' "Create user"
test_endpoint "GET" "/users/1" "" "Get user by ID"
test_endpoint "PATCH" "/users/1" '{"firstName":"Updated"}' "Update user"
echo

echo "🏠 === DEVICES ENDPOINTS ==="
test_endpoint "GET" "/devices" "" "List devices"
test_endpoint "POST" "/devices" '{"identifier":"ESP32_'$(date +%s)'","deviceType":"esp32","model":"ESP32-WROOM-32"}' "Create device"
test_endpoint "GET" "/devices/1" "" "Get device by ID"
test_endpoint "PATCH" "/devices/1" '{"metadata":{"updated":true}}' "Update device"
test_endpoint "DELETE" "/devices/1" "" "Delete device"
echo

echo "🔧 === COMPONENTS ENDPOINTS ==="
test_endpoint "GET" "/components/types" "" "List component types"
test_endpoint "POST" "/components/types" '{"name":"Sensor","identifier":"temp_sensor_'$(date +%s)'","category":"sensor"}' "Create component type"
test_endpoint "GET" "/components/deployments" "" "List deployments"
test_endpoint "POST" "/components/deployments" '{"componentTypeId":1,"deviceId":1}' "Create deployment"
test_endpoint "PATCH" "/components/deployments/1" '{"status":"active"}' "Update deployment"
test_endpoint "DELETE" "/components/deployments/1" "" "Delete deployment"
echo

echo "📊 === SENSORS ENDPOINTS ==="
test_endpoint "GET" "/sensors/readings" "" "List readings"
test_endpoint "GET" "/sensors/readings/latest" "" "Latest readings"
test_endpoint "GET" "/sensors/readings/aggregated" "" "Aggregated readings"
test_endpoint "GET" "/sensors/1/readings" "" "Sensor specific readings"
test_endpoint "GET" "/sensors/1/stats" "" "Sensor stats"
echo

echo "⚡ === ACTUATORS ENDPOINTS ==="
test_endpoint "POST" "/actuators/1/command" '{"command":"turn_on","parameters":{"intensity":75}}' "Send command"
test_endpoint "GET" "/actuators/1/commands" "" "Command history"
test_endpoint "GET" "/actuators/1/status" "" "Actuator status"
echo

echo "🏗️ === ZONES ENDPOINTS ==="
test_endpoint "GET" "/zones" "" "List zones"
test_endpoint "POST" "/zones" '{"name":"Zone Test '$(date +%s)'","description":"Test zone"}' "Create zone"
test_endpoint "GET" "/zones/1" "" "Get zone by ID"
test_endpoint "PATCH" "/zones/1" '{"description":"Updated zone"}' "Update zone"
test_endpoint "DELETE" "/zones/1" "" "Delete zone"
test_endpoint "POST" "/zones/1/components/1" "" "Assign component to zone"
echo

echo "🤖 === AUTOMATION ENDPOINTS ==="
test_endpoint "GET" "/automation/rules" "" "List automation rules"
test_endpoint "POST" "/automation/rules" '{"name":"Rule Test '$(date +%s)'","sensorDeploymentId":1,"conditionOperator":">","conditionValue":25}' "Create rule"
test_endpoint "GET" "/automation/rules/1" "" "Get rule by ID"
test_endpoint "PATCH" "/automation/rules/1" '{"conditionValue":30}' "Update rule"
test_endpoint "DELETE" "/automation/rules/1" "" "Delete rule"
test_endpoint "POST" "/automation/rules/1/activate" '{"isActive":true}' "Activate rule"
test_endpoint "GET" "/automation/alerts" "" "List alerts"
echo

echo "📊 === RÉSULTATS ==="
echo "✅ Tests réussis: $PASSED"
echo "❌ Tests échoués: $FAILED"
echo "📈 Total: $((PASSED + FAILED))"

# Cleanup
rm -f cookies.txt

if [ $FAILED -eq 0 ]; then
    echo "🎉 Tous les endpoints fonctionnent correctement!"
    exit 0
else
    echo "⚠️  Certains endpoints ont des problèmes"
    exit 1
fi