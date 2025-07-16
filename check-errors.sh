#!/bin/bash

# Check for TypeScript compilation errors
echo "Checking TypeScript compilation..."
npx tsc --noEmit

# Check if CSS files can be parsed
echo "Checking CSS files..."
find src/styles -name "*.css" -type f | while read -r file; do
  echo "Checking $file..."
  # Simple check for unclosed brackets or invalid syntax
  if ! grep -q "^[[:space:]]*}" "$file" && grep -q "{" "$file"; then
    echo "Warning: Potential unclosed bracket in $file"
  fi
done

echo "Basic checks completed."
