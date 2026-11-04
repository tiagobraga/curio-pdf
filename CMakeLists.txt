cmake_minimum_required(VERSION 3.5)

project(leitorpdf.braga LANGUAGES CXX)

set(APP_DIR "leitorpdf.braga")
set(DATA_DIR "${CMAKE_INSTALL_PREFIX}")

# Gerar manifest.json e desktop a partir dos arquivos .in
configure_file(manifest.json.in "${CMAKE_CURRENT_BINARY_DIR}/manifest.json" @ONLY)
configure_file(leitorpdf.desktop.in "${CMAKE_CURRENT_BINARY_DIR}/leitorpdf.desktop" @ONLY)

install(FILES "${CMAKE_CURRENT_BINARY_DIR}/manifest.json" DESTINATION "${DATA_DIR}")
install(FILES "${CMAKE_CURRENT_BINARY_DIR}/leitorpdf.desktop" DESTINATION "${DATA_DIR}")
install(FILES leitorpdf.apparmor DESTINATION "${DATA_DIR}")
install(FILES leitorpdf.content-hub DESTINATION "${DATA_DIR}")
install(FILES content-hub.json DESTINATION "${DATA_DIR}")

# Instalar QML, Assets e Helper Python
install(DIRECTORY qml DESTINATION "${DATA_DIR}")
install(DIRECTORY assets DESTINATION "${DATA_DIR}")
install(DIRECTORY src DESTINATION "${DATA_DIR}")
