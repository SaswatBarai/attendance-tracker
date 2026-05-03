import QRCode from 'qrcode';

export async function buildQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#121212',
      light: '#FFFFFF',
    },
  });
}
