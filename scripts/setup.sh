#!/bin/bash
# CaferServer - Sunucu Kurulum Scripti
# Bu scripti Hetzner sunucusunda çalıştırın

set -e

echo "🏰 CaferServer Kurulumu Başlıyor..."

# 1. PostgreSQL veritabanı oluştur
echo "📦 Veritabanı oluşturuluyor..."
docker exec -i $(docker ps -q -f "name=postgres" | head -1) psql -U postgres -c "CREATE DATABASE caferserver;" 2>/dev/null || echo "DB zaten mevcut"
docker exec -i $(docker ps -q -f "name=postgres" | head -1) psql -U postgres -c "CREATE USER cafer WITH PASSWORD 'caferserver123';" 2>/dev/null || echo "User zaten mevcut"
docker exec -i $(docker ps -q -f "name=postgres" | head -1) psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE caferserver TO cafer;" 2>/dev/null || true
docker exec -i $(docker ps -q -f "name=postgres" | head -1) psql -U postgres -d caferserver -c "GRANT ALL ON SCHEMA public TO cafer;" 2>/dev/null || true

echo "✅ Veritabanı hazır!"

# 2. Migration çalıştır
echo "📋 Migration çalıştırılıyor..."
npx prisma db push --skip-generate 2>/dev/null || npx prisma migrate deploy

# 3. Seed çalıştır
echo "🌱 Seed verileri yükleniyor..."
npm run seed

echo ""
echo "🏰 CaferServer kurulumu tamamlandı!"
echo "   Kullanıcı: cafer"
echo "   Şifre: admin123"
echo "   ⚠️  Şifreyi değiştirmeyi unutmayın!"
