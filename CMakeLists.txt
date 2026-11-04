cmake_minimum_required(VERSION 3.5)

project(curio-pdf LANGUAGES CXX)

set(APP_DIR "curio-pdf")
set(DATA_DIR "${CMAKE_INSTALL_PREFIX}")

# Gerar manifest.json e desktop a partir dos arquivos .in
configure_file(manifest.json.in "${CMAKE_CURRENT_BINARY_DIR}/manifest.json" @ONLY)
configure_file(curio-pdf.desktop.in "${CMAKE_CURRENT_BINARY_DIR}/curio-pdf.desktop" @ONLY)

install(FILES "${CMAKE_CURRENT_BINARY_DIR}/manifest.json" DESTINATION "${DATA_DIR}")
install(FILES "${CMAKE_CURRENT_BINARY_DIR}/curio-pdf.desktop" DESTINATION "${DATA_DIR}")
install(FILES curio-pdf.apparmor DESTINATION "${DATA_DIR}")
install(FILES curio-pdf.content-hub DESTINATION "${DATA_DIR}")
install(FILES content-hub.json DESTINATION "${DATA_DIR}")

# Instalar QML, Assets e Helper Python
install(DIRECTORY qml DESTINATION "${DATA_DIR}")
install(DIRECTORY assets DESTINATION "${DATA_DIR}")
install(DIRECTORY src DESTINATION "${DATA_DIR}")
