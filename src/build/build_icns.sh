mkdir "FP Studio Icon.iconset" && \
for s in 16 32 128 256 512; do
  sips -z $s $s "FP Studio Icon.png" --out "FP Studio Icon.iconset/icon_${s}x${s}.png"
  sips -z $(($s*2)) $(($s*2)) "FP Studio Icon.png" --out "FP Studio Icon.iconset/icon_${s}x${s}@2x.png"
done && \
iconutil -c icns "FP Studio Icon.iconset" -o "FP Studio Icon.icns"
