// 그림에서 인물만 따낸다 (macOS Vision, 외부 전송 없음). scripts/cut-characters.mjs 의 원본 준비 참고
// 사용법: swift scripts/cutout-subject.swift <입력 그림> <출력 PNG>
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: input) else { fatalError("read") }
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ci)
try handler.perform([req])
guard let obs = req.results?.first else { fatalError("no subject") }
let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
try ctx.writePNGRepresentation(of: out, to: output, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("ok", out.extent)
