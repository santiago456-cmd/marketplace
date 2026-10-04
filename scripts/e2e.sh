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

echo; echo "$ok OK, $ko fallos"
[ "$ko" -eq 0 ]
