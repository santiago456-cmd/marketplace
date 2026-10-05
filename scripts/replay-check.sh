#!/usr/bin/env bash
# Prueba de idempotencia: reprocesa toda la saga y verifica que el estado no cambie.
# Catalog y Order deben estar DETENIDOS al empezar.
K="docker compose exec -T kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092"

snap() {
  docker compose exec -T postgres-catalog psql -U catalog -At -c "select id, stock, version from products order by id"
  docker compose exec -T postgres-catalog psql -U catalog -At -c "select status, count(*) from stock_reservations group by status order by status"
  docker compose exec -T postgres-order   psql -U orders  -At -c "select count(*) from order_events"
}
# Suma del LAG de los tres grupos (eventos pendientes de procesar)
lag_total() {
  for g in catalog-service order-service-payments order-service; do
    $K --describe --group $g 2>/dev/null | awk -v g=$g '$1==g && $6 ~ /^[0-9]+$/ {s+=$6} END {print s+0}'
  done | paste -sd+ | bc
}
reset() { $K --group "$1" --topic "$2" --reset-offsets --to-earliest --execute > /dev/null 2>&1; }

echo "1) Foto del estado antes del reproceso"
snap > /tmp/replay-before.txt

echo "2) Rebobinando offsets al inicio"
reset catalog-service        orders.lifecycle
reset order-service-payments orders.lifecycle
reset order-service          catalog.inventory
PENDING=$(lag_total)
if [ "$PENDING" -eq 0 ]; then
  echo "✘ El rebobinado no tuvo efecto (lag 0). ¿Catalog u Order siguen corriendo? Detenlos y reintenta."
  exit 1
fi
echo "   eventos pendientes de reprocesar: $PENDING"

read -rp "3) Arranca 'pnpm dev:catalog' y 'pnpm dev:order', espera ~10 s a que los logs se calmen, detenlos con Ctrl+C y pulsa Enter... "
sleep 3

echo "4) Foto después del reproceso"
snap > /tmp/replay-after.txt
REMAINING=$(lag_total)
[ "$REMAINING" -eq 0 ] && echo "   ✔ lag 0: se leyó todo el tópico" || echo "   ✘ quedan $REMAINING eventos sin leer: esperaste poco"

if diff /tmp/replay-before.txt /tmp/replay-after.txt; then
  echo "   ✔ idéntico: el reproceso no cambió nada"
else
  echo "   ✘ el estado cambió (diferencias arriba)"; exit 1
fi
