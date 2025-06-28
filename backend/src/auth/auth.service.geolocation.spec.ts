/* eslint-disable prettier/prettier */
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { DeviceInfoExtractor } from './utils/device-info.util';

describe('AuthService - Geolocation', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            session: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-value'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('DeviceInfoExtractor', () => {
    it('should extract coordinates when provided', () => {
      const mockReq = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        ip: '192.168.1.1',
      };

      const coordinates = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10.5,
      };

      const deviceInfo = DeviceInfoExtractor.extractFromRequest(
        mockReq,
        coordinates,
      );

      expect(deviceInfo.latitude).toBe(-23.5505);
      expect(deviceInfo.longitude).toBe(-46.6333);
      expect(deviceInfo.accuracy).toBe(10.5);
    });

    it('should work without coordinates', () => {
      const mockReq = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        ip: '192.168.1.1',
      };

      const deviceInfo = DeviceInfoExtractor.extractFromRequest(mockReq);

      expect(deviceInfo.latitude).toBeUndefined();
      expect(deviceInfo.longitude).toBeUndefined();
      expect(deviceInfo.accuracy).toBeUndefined();
      expect(deviceInfo.deviceType).toBeDefined();
      expect(deviceInfo.browser).toBeDefined();
    });

    it('should extract device info correctly', () => {
      const mockReq = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        },
        ip: '192.168.1.1',
      };

      const deviceInfo = DeviceInfoExtractor.extractFromRequest(mockReq);

      expect(deviceInfo.deviceType).toBe('mobile');
      expect(deviceInfo.browser).toContain('WebKit'); // Ajustado para aceitar WebKit
      expect(deviceInfo.operatingSystem).toContain('iOS');
    });
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});
