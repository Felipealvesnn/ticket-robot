import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  operatingSystem?: string;
  browser?: string;
  browserVersion?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export class DeviceInfoExtractor {
  static extractFromRequest(
    req: any,
    coordinates?: { lat: number; lng: number; accuracy?: number },
  ): DeviceInfo {
    const userAgent = (req.headers['user-agent'] as string) || '';
    const ip = this.getClientIP(req);

    // Parse do User-Agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Informações de geolocalização
    const geo = ip ? geoip.lookup(ip) : null;

    // Criar um device fingerprint simples (sem MAC address real por segurança)
    const deviceId = this.generateDeviceFingerprint(req, result);

    return {
      deviceId,
      deviceName: this.getDeviceName(result),
      deviceType: this.getDeviceType(result),
      operatingSystem: this.getOperatingSystem(result),
      browser: result.browser.name || undefined,
      browserVersion: result.browser.version || undefined,
      country: geo?.country || undefined,
      region: geo?.region || undefined,
      city: geo?.city || undefined,
      timezone: geo?.timezone || undefined,
      // Coordenadas GPS (opcionais)
      latitude: coordinates?.lat || undefined,
      longitude: coordinates?.lng || undefined,
      accuracy: coordinates?.accuracy || undefined,
    };
  }

  private static getClientIP(req: any): string | null {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      null
    );
  }

  private static generateDeviceFingerprint(req: any, uaResult: any): string {
    // Criar um fingerprint baseado em características do dispositivo
    // NÃO é o MAC address real, mas um identificador único baseado no conjunto de informações
    const components = [
      uaResult.browser.name || 'unknown',
      uaResult.browser.version || 'unknown',
      uaResult.os.name || 'unknown',
      uaResult.os.version || 'unknown',
      uaResult.device.vendor || 'unknown',
      uaResult.device.model || 'unknown',
      req.headers['accept-language'] || 'unknown',
      req.headers['accept-encoding'] || 'unknown',
    ];

    // Criar hash simples
    const fingerprint = Buffer.from(components.join('|')).toString('base64');
    return fingerprint.substring(0, 16); // Primeiros 16 caracteres
  }

  private static getDeviceName(result: any): string {
    const { device, os, browser } = result;

    if (device.vendor && device.model) {
      return `${device.vendor} ${device.model}`;
    }

    if (os.name && browser.name) {
      return `${os.name} - ${browser.name}`;
    }

    return 'Dispositivo Desconhecido';
  }

  private static getDeviceType(result: any): string {
    const { device } = result;

    if (device.type) {
      return device.type; // mobile, tablet, console, smarttv, wearable, embedded
    }

    // Fallback baseado no OS
    const os = result.os.name?.toLowerCase() || '';
    if (os.includes('android') || os.includes('ios')) {
      return 'mobile';
    }

    return 'desktop';
  }

  private static getOperatingSystem(result: any): string {
    const { os } = result;

    if (os.name && os.version) {
      return `${os.name} ${os.version}`;
    }

    return os.name || 'Desconhecido';
  }
}
