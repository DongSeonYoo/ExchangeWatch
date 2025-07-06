#!/bin/sh
set -e

echo "Downloading historical seed data from S3..."
aws s3 cp s3://exchange-watch-seeds/historical-mock/ /usr/src/app/historical-mock/ --recursive

echo "Running database migrations..."
npx prisma migrate deploy

# start database seeding
# using historical-mock json files
echo "Running database seeding..."
npm run seed:prod

echo "Starting application..."
exec "$@"
