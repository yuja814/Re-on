#!/bin/zsh
set -euo pipefail
cd "${0:A:h}/../backend"
if [[ -x /opt/homebrew/opt/openjdk@21/bin/java ]]; then
 export JAVA_HOME=/opt/homebrew/opt/openjdk@21
else
 export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
fi
./gradlew bootJar
exec "$JAVA_HOME/bin/java" -jar build/libs/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev --server.port=18090
