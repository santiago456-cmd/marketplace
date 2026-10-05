#!/usr/bin/env bash
# Prueba de regresión end-to-end. Requiere los 4 servicios levantados y jq.
GW=${GW:-localhost:3000}
RUN=$RANDOM
J='content-type: application/json'
ok=0; ko=0

check() { # descripción, esperado, obtenido
  if [ "$2" = "$3" ]; then echo "  ✔ $1"; ok=$((ok+1)); else echo "  ✘ $1 (esperado $2, obtenido $3)"; ko=$((ko+1)); fi
}
code()    { curl -s -o /dev/null -w '%{http_code}' "$@"; }
regcode() { code -X POST $GW/auth/register -H "$J" -d "{\"email\":\"$1\",\"password\":\"$3\",\"roles\":[\"$2\"]}"; }
login()   { curl -s -X POST $GW/auth/login -H "$J" -d "{\"email\":\"$1\",\"password\":\"Secreta123\"}" | jq -r .accessToken; }
post()    { code -X POST $GW/products -H "authorization: Bearer $1" -H "$J" -d "$2"; }
status_of()   { curl -s $GW/orders/$1 -H "authorization: Bearer $2" | jq -r .status; }
wait_status() { local s; for _ in $(seq 1 20); do s=$(status_of $1 $2); [ "$s" = "$3" ] && break; sleep 0.5; done; echo "$s"; }
stock_of()    { curl -s $GW/products/$1 | jq -r .stock; }
wait_stock() { local s; for _ in $(seq 1 20); do s=$(stock_of $1); [ "$s" = "$2" ] && break; sleep 0.5; done; echo "$s"; }
mkprod() { # stock -> id de un producto publicado
  local pid
  pid=$(curl -s -X POST $GW/products -H "authorization: Bearer $TS" -H "$J" \
    -d "{\"name\":\"Producto $RUN\",\"categoryId\":\"deportes\",\"price\":{\"amount\":1000000,\"currency\":\"ARS\"},\"stock\":$1,\"condition\":\"NEW\"}" | jq -r .productId)
  curl -s -o /dev/null -X POST $GW/products/$pid/publish -H "authorization: Bearer $TS"
  echo $pid
}
mkorder() { # token, líneas en JSON -> orderId
  curl -s -X POST $GW/orders -H "authorization: Bearer $1" -H "$J" -d "{\"lines\":$2}" | jq -r .orderId
}

echo "Identity"
check "registro 201" 201 "$(regcode v1-$RUN@test.com SELLER Secreta123)"
regcode v2-$RUN@test.com SELLER Secreta123 > /dev/null
regcode b-$RUN@test.com BUYER Secreta123 > /dev/null
TS=$(login v1-$RUN@test.com); TS2=$(login v2-$RUN@test.com); TB=$(login b-$RUN@test.com)
check "email repetido 409" 409 "$(regcode v1-$RUN@test.com SELLER Secreta123)"
check "contraseña débil 400" 400 "$(regcode x-$RUN@test.com BUYER corta)"
check "login incorrecto 401" 401 "$(code -X POST $GW/auth/login -H "$J" -d "{\"email\":\"v1-$RUN@test.com\",\"password\":\"Incorrecta1\"}")"
check "token manipulado 401" 401 "$(code $GW/users/me -H "authorization: Bearer ${TS}x")"
check "/users/me 200" 200 "$(code $GW/users/me -H "authorization: Bearer $TS")"

echo "Catalog"
PRODUCT="{\"name\":\"Bicicleta $RUN\",\"categoryId\":\"deportes\",\"price\":{\"amount\":15000000,\"currency\":\"ARS\"},\"stock\":1,\"condition\":\"USED\"}"
check "comprador no crea 403" 403 "$(post $TB "$PRODUCT")"
check "sin token 401" 401 "$(code -X POST $GW/products -H "$J" -d "$PRODUCT")"
check "body inválido 400 (Zod)" 400 "$(post $TS '{}')"
check "nombre corto 400 (dominio)" 400 "$(post $TS '{"name":"ab","categoryId":"x","price":{"amount":1,"currency":"ARS"},"stock":1,"condition":"NEW"}')"
ID=$(curl -s -X POST $GW/products -H "authorization: Bearer $TS" -H "$J" -d "$PRODUCT" | jq -r .productId)
check "vendedor crea producto" true "$([ -n "$ID" ] && [ "$ID" != null ] && echo true || echo false)"
check "otro vendedor no publica 403" 403 "$(code -X POST $GW/products/$ID/publish -H "authorization: Bearer $TS2")"
check "dueño publica 200" 200 "$(code -X POST $GW/products/$ID/publish -H "authorization: Bearer $TS")"
check "republicar 422" 422 "$(code -X POST $GW/products/$ID/publish -H "authorization: Bearer $TS")"
check "lectura pública 200" 200 "$(code $GW/products/$ID)"
check "inexistente 404" 404 "$(code $GW/products/$(cat /proc/sys/kernel/random/uuid))"
check "Catalog directo sin identidad 401" 401 "$(code -X POST localhost:3001/products -H "$J" -d "$PRODUCT")"

echo "Search"
sleep 2
check "producto publicado aparece" true "$(curl -s "$GW/search/products?q=$RUN" | jq --arg id "$ID" '[.items[].productId] | index($id) != null')"
check "rango inválido 400" 400 "$(code "$GW/search/products?minPrice=100&maxPrice=10")"
check "parámetro inválido 400 (Zod)" 400 "$(code "$GW/search/products?sort=barato")"

echo "Order"
uuid() { cat /proc/sys/kernel/random/uuid; }
opost() { code -X POST $GW/orders -H "authorization: Bearer $1" -H "$J" -d "$2"; }
OPAYLOAD="{\"lines\":[{\"productId\":\"$ID\",\"quantity\":2}]}"

curl -s -X POST $GW/auth/register -H "$J" -d "{\"email\":\"b2-$RUN@test.com\",\"password\":\"Secreta123\",\"roles\":[\"BUYER\"]}" > /dev/null
curl -s -X POST $GW/auth/register -H "$J" -d "{\"email\":\"dual-$RUN@test.com\",\"password\":\"Secreta123\",\"roles\":[\"SELLER\",\"BUYER\"]}" > /dev/null
TB2=$(login b2-$RUN@test.com); TD=$(login dual-$RUN@test.com)
IDD=$(curl -s -X POST $GW/products -H "authorization: Bearer $TD" -H "$J" -d "$PRODUCT" | jq -r .productId)
curl -s -o /dev/null -X POST $GW/products/$IDD/publish -H "authorization: Bearer $TD"
IDR=$(curl -s -X POST $GW/products -H "authorization: Bearer $TS" -H "$J" -d "$PRODUCT" | jq -r .productId)  # borrador

check "vendedor sin rol BUYER no compra 403" 403 "$(opost $TS "$OPAYLOAD")"
check "orden sin token 401" 401 "$(code -X POST $GW/orders -H "$J" -d "$OPAYLOAD")"
check "carrito vacío 400" 400 "$(opost $TB '{"lines":[]}')"
check "producto inexistente 422" 422 "$(opost $TB "{\"lines\":[{\"productId\":\"$(uuid)\",\"quantity\":1}]}")"
check "producto en borrador 422" 422 "$(opost $TB "{\"lines\":[{\"productId\":\"$IDR\",\"quantity\":1}]}")"
check "comprar producto propio 422" 422 "$(opost $TD "{\"lines\":[{\"productId\":\"$IDD\",\"quantity\":1}]}")"
OID=$(curl -s -X POST $GW/orders -H "authorization: Bearer $TB" -H "$J" -d "$OPAYLOAD" | jq -r .orderId)
check "comprador crea la orden" true "$([ -n "$OID" ] && [ "$OID" != null ] && echo true || echo false)"
check "stock insuficiente rechaza la orden (stock 1, cantidad 2)" REJECTED "$(wait_status $OID $TB REJECTED)"
check "ver orden propia 200" 200 "$(code $GW/orders/$OID -H "authorization: Bearer $TB")"
check "ver orden ajena 403" 403 "$(code $GW/orders/$OID -H "authorization: Bearer $TB2")"

echo "Saga: reserva de stock"
P1=$(mkprod 5); P2=$(mkprod 1)
O1=$(mkorder $TB "[{\"productId\":\"$P1\",\"quantity\":2}]")
check "stock suficiente y pago aprobado: orden PAID" PAID "$(wait_status $O1 $TB PAID)"
check "stock descontado en Catalog (5 - 2)" 3 "$(stock_of $P1)"
O2=$(mkorder $TB "[{\"productId\":\"$P1\",\"quantity\":10}]")
check "stock insuficiente: orden rechazada" REJECTED "$(wait_status $O2 $TB REJECTED)"
check "el rechazo explica el motivo" true "$(curl -s $GW/orders/$O2 -H "authorization: Bearer $TB" | jq '.statusReason | startswith("Stock insuficiente")')"
check "un rechazo no descuenta stock" 3 "$(stock_of $P1)"
O3=$(mkorder $TB "[{\"productId\":\"$P1\",\"quantity\":1},{\"productId\":\"$P2\",\"quantity\":5}]")
check "todo o nada: orden mixta rechazada" REJECTED "$(wait_status $O3 $TB REJECTED)"
check "todo o nada: el producto con stock queda intacto" 3 "$(stock_of $P1)"

echo "Saga: pago y compensación"
check "pago aprobado registra el paymentId" true "$(curl -s $GW/orders/$O1 -H "authorization: Bearer $TB" | jq '.paymentId | startswith("sim_")')"
P3=$(mkprod 100)                                                   # 1.000.000 c/u; el límite del simulador es 50.000.000
O4=$(mkorder $TB "[{\"productId\":\"$P3\",\"quantity\":60}]")      # total 60.000.000: supera el límite
check "pago rechazado: orden cancelada" CANCELLED "$(wait_status $O4 $TB CANCELLED)"
check "compensación: el stock vuelve a 100" 100 "$(wait_stock $P3 100)"
check "la cancelación explica el motivo" true "$(curl -s $GW/orders/$O4 -H "authorization: Bearer $TB" | jq '.statusReason | startswith("Pago rechazado")')"
echo; echo "$ok OK, $ko fallos"
[ "$ko" -eq 0 ]
