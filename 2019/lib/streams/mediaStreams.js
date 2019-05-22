/**
 * @license
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var Media = (function() {
  const PLAYREADY_SIGNATURE_1 =
      '448279561E2755699618BE0A2402189D4A30B03B.0CD6A27286BD2DAF00577FFA21928665DCD320C2';
  const SINTEL_PLAYREADY_SIGNATURE =
      '97963FB1090C927460E392A517D769E95F90A9C2.71CBD94195457E4E2D885064FDB879C1072AF323';
  const WIDEVINE_SIGNATURE_1 =
      '9C4BE99E6F517B51FED1F0B3B31966D3C5DAB9D6.6A1F30BB35F3A39A4CA814B731450D4CBD198FFD';
  const SINTEL_WIDEVINE_SIGNATURE =
      '4511DBFEF4177B5F0DF1FAA23562D4FD7FDE0D1A.457901F5F063B3D9E8252B403D120683BEE47216';

  var AAC = {
    streamtype: 'AAC',
    mimetype: 'audio/mp4; codecs="mp4a.40.2"',
    mediatype: 'audio',
    streams: {
      AudioTiny: ['car-20120827-8b.mp4', 717502, 181.62],
      AudioNormal: ['car-20120827-8c.mp4', 2884572, 181.58, {200000: 12.42}],
      AudioHuge: [
        'car-20120827-8d.mp4', 5789853, 181.58, {'appendAudioOffset': 17.42}
      ],
      Audio51: ['sintel-trunc.mp4', 813119, 20.05],
      Audio1MB: ['car-audio-1MB-trunc.mp4', 1048576, 65.875],
      AudioLowExplicitHE: [
        'spotlight-tr-heaac-explicit.mp4', 156137, 26.10, {
          'mimeType': 'audio/mp4; codecs="mp4a.40.5"',
          'sbrSignaling': 'Explicit'
        }
      ],
      AudioLowImplicitHE: [
        'spotlight-tr-heaac-implicit.mp4', 156138, 26.10, {
          'mimeType': 'audio/mp4; codecs="mp4a.40.5"',
          'sbrSignaling': 'Implicit'
        }
      ],
      AudioForVP9Live: ['vp9-live.mp4', 243930, 14.997],
      AudioNormalClearKey: [
        'car_cenc-20120827-8c.mp4', 3013084, 181.58, {
          'key': util.createUint8ArrayFromJSArray([
            0x1a, 0x8a, 0x20, 0x95, 0xe4, 0xde, 0xb2, 0xd2,
            0x9e, 0xc8, 0x16, 0xac, 0x7b, 0xae, 0x20, 0x82
          ]),
          'kid': util.createUint8ArrayFromJSArray([
            0x60, 0x06, 0x1e, 0x01, 0x7e, 0x47, 0x7e, 0x87,
            0x7e, 0x57, 0xd0, 0x0d, 0x1e, 0xd0, 0x0d, 0x1e
          ])
        }
      ],
      AudioSmallCenc: [
        'oops_cenc-20121114-148.mp4', 999679, 242.71, {
          'video_id': '03681262dc412c06',
          'playready_signature': PLAYREADY_SIGNATURE_1,
          'widevine_signature': WIDEVINE_SIGNATURE_1
        }
      ],
    },
  };

  var Opus = {
    streamtype: 'Opus',
    mimetype: 'audio/webm; codecs="opus"',
    mediatype: 'audio',
    streams: {
      Audio51: ['opus51.webm', 15583281, 300.02],
      CarLow: ['car_opus_low.webm', 1205174, 181.48],
      CarMed: ['car_opus_med.webm', 1657817, 181.48, {200000: 28.221}],
      CarHigh: [
        'car_opus_high.webm', 3280103, 181.48, {'appendAudioOffset': 33.221}
      ],
      SantaHigh: ['santa_opus_high.webm', 1198448, 70.861],
      SintelEncrypted: [
        'sintel_opus_enc.webm', 14956771, 888.04, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE
        }
      ],
    },
  };

  var H264 = {
    streamtype: 'H264',
    mimetype: 'video/mp4; codecs="avc1.640028"',
    mediatype: 'video',
    streams: {
      VideoTiny: [
        'car-20120827-85.mp4', 6015001, 181.44, {
          'videoChangeRate': 11.47,
          'mimeType': 'video/mp4; codecs="avc1.4d4015"',
          'resolution': '240p'
        }
      ],
      VideoNormal: [
        'car-20120827-86.mp4', 15593225, 181.44,
        {'mimeType': 'video/mp4; codecs="avc1.4d401e"', 'resolution': '360p'}
      ],
      CarMedium: [
        'car09222016-med-134.mp4', 10150205, 181.47,
        {'mimeType': 'video/mp4; codecs="avc1.4d401e"', 'resolution': '360p'}
      ],
      VideoHuge: [
        'car-20120827-89.mp4', 95286345, 181.44,
        {'mimeType': 'video/mp4; codecs="avc1.640028"', 'resolution': '1080p'}
      ],
      Video1MB: [
        'test-video-1MB.mp4', 1053406, 1.04, {
          'mimeType': 'video/mp4; codecs="avc1.4d401f"',
          'resolution': '360p',
          'width': 480
        }
      ],
      VideoNormalClearKey: [
        'car_cenc-20120827-86.mp4', 15795193, 181.44, {
          'mimeType': 'video/mp4; codecs="avc1.4d401e"',
          'key': util.createUint8ArrayFromJSArray([
            0x1a, 0x8a, 0x20, 0x95, 0xe4, 0xde, 0xb2, 0xd2,
            0x9e, 0xc8, 0x16, 0xac, 0x7b, 0xae, 0x20, 0x82
          ]),
          'kid': util.createUint8ArrayFromJSArray([
            0x60, 0x06, 0x1e, 0x01, 0x7e, 0x47, 0x7e, 0x87,
            0x7e, 0x57, 0xd0, 0x0d, 0x1e, 0xd0, 0x0d, 0x1e
          ]),
          'resolution': '360p'
        }
      ],
      VideoStreamYTCenc: [
        'oops_cenc-20121114-145-no-clear-start.mp4', 39980507, 242.71, {
          'mimeType': 'video/mp4; codecs="avc1.4d401f"',
          'video_id': '03681262dc412c06',
          'widevine_signature': WIDEVINE_SIGNATURE_1,
          'key': util.createUint8ArrayFromJSArray([
            233, 122, 210, 133, 203, 93, 59, 228,
            167, 150, 27, 122, 246, 145, 112, 218
          ]),
          'resolution': '720p'
        }
      ],
      VideoTinyStreamYTCenc: [
        'oops_cenc-20121114-145-143.mp4', 7229257, 30.03,
        {'mimeType': 'video/mp4; codecs="avc1.4d401f"', 'resolution': '720p'}
      ],
      VideoSmallStreamYTCenc: [
        'oops_cenc-20121114-143-no-clear-start.mp4', 12045546, 242.71, {
          'mimeType': 'video/mp4; codecs="avc1.4d401e"',
          'key': util.createUint8ArrayFromJSArray([
            131, 162, 92, 175, 153, 178, 172, 41,
            2, 167, 251, 126, 233, 215, 230, 185
          ]),
          'resolution': '360p'
        }
      ],
      VideoSmallCenc: [
        'oops_cenc-20121114-142.mp4', 8017271, 242.71, {
          'mimeType': 'video/mp4; codecs="avc1.4d4015"',
          'video_id': '03681262dc412c06',
          'playready_signature': PLAYREADY_SIGNATURE_1,
          'widevine_signature': WIDEVINE_SIGNATURE_1,
          'resolution': '240p'
        }
      ],
      VideoMultiKeyCenc: [
        'tears_h264_main_720p_1500.mp4', 105466539, 734.17, {
          'mimetype': 'video/mp4; codecs="avc1.4d401f"',
          'pssh': util.createUint8ArrayFromJSArray([
            0,   0,   0,   68,  112, 115, 115, 104,
            0,   0,   0,   0,   237, 239, 139, 169,
            121, 214, 74,  206, 163, 200, 39,  220,
            213, 29,  33,  237, 0,   0,   0,   36,
            8,   1,   18,  1,   49,  26,  13,  119,
            105, 100, 101, 118, 105, 110, 101, 95,
            116, 101, 115, 116, 34,  10,  50,  48,
            49,  53,  95,  116, 95,  49,  54,  107,
            42,  2,   83,  68
          ]),
          'license_server': 'https://proxy.staging.widevine.com/proxy',
          'width': 1280,
          'height': 532
        }
      ],
      SintelLowCenc: [
        'sintel_h264_low_cenc.mp4', 21009141, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'resolution': '240p',
          'height': 182
        }
      ],
      SintelMedCenc: [
        'sintel_h264_med_cenc.mp4', 36242861, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'resolution': '360p',
          'height': 272
        }
      ],
      SintelHighCenc: [
        'sintel_h264_high_cenc.mp4', 73176349, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'width': 854,
          'height': 364
        }
      ],
      SintelHighMqCenc: [
        'sintel_h264_highmq_cenc.mp4', 113752205, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'width': 854,
          'height': 364
        }
      ],
      SintelHighHqCenc: [
        'sintel_h264_highhq_cenc.mp4', 230730559, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'width': 854,
          'height': 364
        }
      ],
      Sintel720pCenc: [
        'sintel_h264_720p_cenc.mp4', 145423482, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'width': 1280,
          'height': 546
        }
      ],
      Sintel720pMqCenc: [
        'sintel_h264_720pmq_cenc.mp4', 227431200, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'width': 1280,
          'height': 546
        }
      ],
      Sintel720pHqCenc: [
        'sintel_h264_720phq_cenc.mp4', 367564579, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'width': 1280,
          'height': 546
        }
      ],
      Sintel1080pCenc: [
        'sintel_h264_1080p_cenc.mp4', 273516348, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'resolution': '1080p',
          'height': 818
        }
      ],
      Sintel1080pMqCenc: [
        'sintel_h264_1080pmq_cenc.mp4', 405525381, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'resolution': '1080p',
          'height': 818
        }
      ],
      Sintel1080pHqCenc: [
        'sintel_h264_1080phq_cenc.mp4', 562395642, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'playready_signature': SINTEL_PLAYREADY_SIGNATURE,
          'resolution': '1080p',
          'height': 818
        }
      ],
      ProgressiveLow: [
        'car_20130125_18.mp4', 15477531, 181.55,
        {'mimeType': 'video/mp4; codecs="avc1.42c01e"', 'resolution': '360p'}
      ],
      FrameGap: [
        'nq-frames24-tfdt23.mp4', 11883895, 242.46,
        {'mimeType': 'video/mp4; codecs="avc1.4d401e"', 'resolution': '360p'}
      ],
      FrameOverlap: [
        'nq-frames23-tfdt24.mp4', 11883895, 242.46,
        {'mimeType': 'video/mp4; codecs="avc1.4d401e"', 'resolution': '360p'}
      ],
      Webgl144p15fps: [
        'big-buck-bunny-h264-144p-15fps.mp4', 8620045, 634.60, {
          'mimeType': 'video/mp4; codecs="avc1.42c00c"',
          'fps': 15,
          'resolution': '144p'
        }
      ],
      Webgl240p30fps: [
        'big-buck-bunny-h264-240p-30fps.mp4', 19406299, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.4d4015"',
          'fps': 30,
          'resolution': '240p'
        }
      ],
      Webgl360p30fps: [
        'big-buck-bunny-h264-360p-30fps.mp4', 28791964, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.4d401e"',
          'fps': 30,
          'resolution': '360p'
        }
      ],
      Webgl480p30fps: [
        'big-buck-bunny-h264-480p-30fps.mp4', 56238435, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.4d401f"',
          'fps': 30,
          'resolution': '480p'
        }
      ],
      Webgl720p30fps: [
        'big-buck-bunny-h264-720p-30fps.mp4', 106822776, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.4d401f"',
          'fps': 30,
          'resolution': '720p'
        }
      ],
      Webgl720p60fps: [
        'big-buck-bunny-h264-720p-60fps.mp4', 181505335, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.4d4020"',
          'fps': 60,
          'resolution': '720p'
        }
      ],
      Webgl1080p30fps: [
        'big-buck-bunny-h264-1080p-30fps.mp4', 189028629, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.640028"',
          'fps': 30,
          'resolution': '1080p'
        }
      ],
      Webgl1080p60fps: [
        'big-buck-bunny-h264-1080p-60fps.mp4', 313230764, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.64002a"',
          'fps': 60,
          'resolution': '1080p'
        }
      ],
      Webgl1440p30fps: [
        'big-buck-bunny-h264-1440p-30fps.mp4', 454390604, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.640032"',
          'fps': 30,
          'resolution': '1440p'
        }
      ],
      Webgl2160p30fps: [
        'big-buck-bunny-h264-2160p-30fps.mp4', 873983617, 634.57, {
          'mimeType': 'video/mp4; codecs="avc1.640033"',
          'fps': 30,
          'resolution': '2160p'
        }
      ],
      Spherical144s30fps: [
        'spherical_h264_144s_30fps.mp4', 902503, 149.31, {
          'mimeType': 'video/mp4; codecs="avc1.4d400c"',
          'fps': 30,
          'resolution': '144p',
          'spherical': true
        }
      ],
      Spherical240s30fps: [
        'spherical_h264_240s_30fps.mp4', 2095800, 149.31, {
          'mimeType': 'video/mp4; codecs="avc1.4d4015"',
          'fps': 30,
          'resolution': '240p',
          'spherical': true
        }
      ],
      Spherical360s30fps: [
        'spherical_h264_360s_30fps.mp4', 3344623, 149.31, {
          'mimeType': 'video/mp4; codecs="avc1.4d401e"',
          'fps': 30,
          'resolution': '360p',
          'spherical': true
        }
      ],
      Spherical480s30fps: [
        'spherical_h264_480s_30fps.mp4', 7238157, 149.31, {
          'mimeType': 'video/mp4; codecs="avc1.4d401f"',
          'fps': 30,
          'resolution': '480p',
          'spherical': true
        }
      ],
      Spherical720s30fps: [
        'spherical_h264_720s_30fps.mp4', 15323211, 149.31, {
          'mimeType': 'video/mp4; codecs="avc1.4d401f"',
          'fps': 30,
          'resolution': '720p',
          'spherical': true
        }
      ],
      Spherical720s60fps: [
        'spherical_h264_720s_60fps.mp4', 31284601, 149.29, {
          'mimeType': 'video/mp4; codecs="avc1.4d4020"',
          'fps': 60,
          'resolution': '720p',
          'spherical': true
        }
      ],
      Spherical1080s30fps: [
        'spherical_h264_1080s_30fps.mp4', 46455958, 149.31, {
          'mimeType': 'video/mp4; codecs="avc1.640028"',
          'fps': 30,
          'resolution': '1080p',
          'spherical': true
        }
      ],
      Spherical1080s60fps: [
        'spherical_h264_1080s_60fps.mp4', 59213840, 149.29, {
          'mimeType': 'video/mp4; codecs="avc1.64002a"',
          'fps': 60,
          'resolution': '1080p',
          'spherical': true
        }
      ],
      Spherical1440s30fps: [
        'spherical_h264_1440s_30fps.mp4', 97687330, 149.31, {
          'mimeType': 'video/mp4; codecs="avc1.640032"',
          'fps': 30,
          'resolution': '1440p',
          'spherical': true
        }
      ],
      Spherical1440s60fps: [
        'spherical_h264_1440s_60fps.mp4', 131898628, 149.29, {
          'mimeType': 'video/mp4; codecs="avc1.640033"',
          'fps': 60,
          'resolution': '1440p',
          'spherical': true
        }
      ],
      Spherical2160s30fps: [
        'spherical_h264_2160s_30fps.mp4', 179943784, 149.31, {
          'mimeType': 'video/mp4; codecs="avc1.640033"',
          'fps': 30,
          'resolution': '2160p',
          'spherical': true
        }
      ],
      Spherical2160s60fps: [
        'spherical_h264_2160s_60fps.mp4', 239610178, 149.29, {
          'mimeType': 'video/mp4; codecs="avc1.640033"',
          'fps': 60,
          'resolution': '2160p',
          'spherical': true
        }
      ],
    },
  };

  var VP9 = {
    streamtype: 'VP9',
    mimetype: 'video/webm; codecs="vp9"',
    mediatype: 'video',
    streams: {
      VideoTiny: [
        'feelings_vp9-20130806-242.webm', 4478156, 135.46,
        {'videoChangeRate': 15.35, 'resolution': '240p'}
      ],
      VideoNormal: [
        'big-buck-bunny-vp9-360p-30fps.webm', 48362964, 634.53,
        {'resolution': '360p'}
      ],
      VideoHuge: [
        'feelings_vp9-20130806-247.webm', 27757852, 135.46,
        {'resolution': '720p'}
      ],
      Video1MB: ['vp9-video-1mb.webm', 1103716, 1.00, {'resolution': '720p'}],
      VideoLive: [
        'vp9-live-1080p-30fps.webm', 2328275, 14.997,
        {'resolution': '1080p', 'fps': 30}],
      VideoNormalClearKey: [
        'vid_vp9_encrypted03.webm', 657432, 6.00, {
          'key': util.createUint8ArrayFromJSArray([
            186, 232, 192, 193, 246, 129, 195, 1,
            235, 26, 73, 6, 214, 222, 222, 17
          ]),
          'kid': util.createUint8ArrayFromJSArray([
            65, 192, 59, 240, 250, 198, 147, 131,
            234, 178, 123, 253, 240, 131, 240, 129
          ]),
          'resolution': '480p',
          'width': 640
        }
      ],
      VideoStreamYTCenc: [
        'vid_vp9_encrypted04.webm', 657432, 6.00, {
          'key': util.createUint8ArrayFromJSArray([
            186, 232, 192, 193, 246, 129, 195, 1,
            235, 26, 73, 6, 214, 222, 222, 17
          ]),
          'kid': util.createUint8ArrayFromJSArray([
            65, 192, 59, 240, 250, 198, 147, 131,
            234, 178, 123, 253, 240, 131, 240, 129
          ]),
          'resolution': '480p',
          'width': 640
        }
      ],
      VideoSmallStreamYTCenc: [
        'vid_vp9_encrypted05.webm', 657432, 6.00, {
          'key': util.createUint8ArrayFromJSArray([
            179, 232, 192, 192, 150, 129, 195, 1,
            235, 26, 73, 5, 54, 222, 222, 193
          ]),
          'kid': util.createUint8ArrayFromJSArray([
            135, 240, 59, 224, 234, 214, 147, 131,
            234, 176, 123, 253, 240, 131, 240, 220
          ]),
          'resolution': '480p',
          'width': 640
        }
      ],
      VideoHighEnc: [
        'sintel_enc-20160621-273.webm', 68919485, 887.958, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 854,
          'height': 364
        }
      ],
      VideoHighSubSampleEnc: [
        'sintel_enc_subsample-20161014-318.webm', 80844835, 887.958, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 854,
          'height': 364
        }
      ],
      SintelLowEnc: [
        'sintel_vp9_low_enc.webm', 14161546, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'resolution': '240p',
          'height': 182
        }
      ],
      SintelMedEnc: [
        'sintel_vp9_med_enc.webm', 24174480, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'resolution': '360p',
          'height': 272
        }
      ],
      SintelHighEnc: [
        'sintel_vp9_high_enc.webm', 48736011, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 854,
          'height': 364
        }
      ],
      SintelHighMqEnc: [
        'sintel_vp9_highmq_enc.webm', 80843219, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 854,
          'height': 364
        }
      ],
      SintelHighHqEnc: [
        'sintel_vp9_highhq_enc.webm', 202775127, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 854,
          'height': 364
        }
      ],
      Sintel720pEnc: [
        'sintel_vp9_720p_enc.webm', 98685774, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 1280,
          'height': 546
        }
      ],
      Sintel720pMqEnc: [
        'sintel_vp9_720pmq_enc.webm', 156003788, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 1280,
          'height': 546
        }
      ],
      Sintel720pHqEnc: [
        'sintel_vp9_720phq_enc.webm', 270377177, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 1280,
          'height': 546
        }
      ],
      Sintel1080pEnc: [
        'sintel_vp9_1080p_enc.webm', 185239921, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'resolution': '1080p',
          'height': 818
        }
      ],
      Sintel1080pMqEnc: [
        'sintel_vp9_1080pmq_enc.webm', 288587712, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'resolution': '1080p',
          'height': 818
        }
      ],
      Sintel1080pHqEnc: [
        'sintel_vp9_1080phq_enc.webm', 432276105, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'resolution': '1080p',
          'height': 818
        }
      ],
      Sintel2kEnc: [
        'sintel_vp9_2k_enc.webm', 479857063, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'resolution': '1440p',
          'height': 1090
        }
      ],
      Sintel4kEnc: [
        'sintel_vp9_4k_enc.webm', 1037846120, 887.96, {
          'video_id': '31e1685307acf271',
          'widevine_signature': SINTEL_WIDEVINE_SIGNATURE,
          'width': 3840,
          'height': 1636
        }
      ],
      ProgressiveLow: [
        'feelings_vp9-20130806-243.webm', 7902885, 135.46,
        {'resolution': '360p'}
      ],
      Webgl144p30fps: [
        'big-buck-bunny-vp9-144p-30fps.webm', 7102948, 634.53,
        {'fps': 30, 'resolution': '144p'}
      ],
      Webgl240p30fps: [
        'big-buck-bunny-vp9-240p-30fps.webm', 15315502, 634.53,
        {'fps': 30, 'resolution': '240p'}
      ],
      Webgl360p30fps: [
        'big-buck-bunny-vp9-360p-30fps.webm', 28562771, 634.53,
        {'fps': 30, 'resolution': '360p'}
      ],
      Webgl480p30fps: [
        'big-buck-bunny-vp9-480p-30fps.webm', 48362964, 634.53,
        {'fps': 30, 'resolution': '480p'}
      ],
      Webgl720p30fps: [
        'big-buck-bunny-vp9-720p-30fps.webm', 91390585, 634.53,
        {'fps': 30, 'resolution': '720p'}
      ],
      Webgl720p60fps: [
        'big-buck-bunny-vp9-720p-60fps.webm', 151583677, 634.53,
        {'fps': 60, 'resolution': '720p'}
      ],
      Webgl1080p30fps: [
        'big-buck-bunny-vp9-1080p-30fps.webm', 168727073, 634.53,
        {'fps': 30, 'resolution': '1080p'}
      ],
      Webgl1080p60fps: [
        'big-buck-bunny-vp9-1080p-60fps.webm', 252622340, 634.53,
        {'fps': 60, 'resolution': '1080p'}
      ],
      Webgl1440p30fps: [
        'big-buck-bunny-vp9-1440p-30fps.webm', 460158586, 634.53,
        {'fps': 30, 'resolution': '1440p'}
      ],
      Webgl1440p60fps: [
        'big-buck-bunny-vp9-1440p-60fps.webm', 661242960, 634.53,
        {'fps': 60, 'resolution': '1440p'}
      ],
      Webgl2160p30fps: [
        'big-buck-bunny-vp9-2160p-30fps.webm', 1089986842, 634.53,
        {'fps': 30, 'resolution': '2160p'}
      ],
      Webgl2160p60fps: [
        'big-buck-bunny-vp9-2160p-60fps.webm', 1721994529, 634.53,
        {'fps': 60, 'resolution': '2160p'}
      ],
      Spherical144s30fps: [
        'spherical_vp9_144s_30fps.webm', 1386771, 149.28,
        {'fps': 30, 'resolution': '144p', 'spherical': true}
      ],
      Spherical240s30fps: [
        'spherical_vp9_240s_30fps.webm', 2164087, 149.28,
        {'fps': 30, 'resolution': '240p', 'spherical': true}
      ],
      Spherical360s30fps: [
        'spherical_vp9_360s_30fps.webm', 4539259, 149.28,
        {'fps': 30, 'resolution': '360p', 'spherical': true}
      ],
      Spherical480s30fps: [
        'spherical_vp9_480s_30fps.webm', 8181410, 149.28,
        {'fps': 30, 'resolution': '480p', 'spherical': true}
      ],
      Spherical720s30fps: [
        'spherical_vp9_720s_30fps.webm', 18142938, 149.28,
        {'fps': 30, 'resolution': '720p', 'spherical': true}
      ],
      Spherical720s60fps: [
        'spherical_vp9_720s_60fps.webm', 25630410, 149.29,
        {'fps': 60, 'resolution': '720p', 'spherical': true}
      ],
      Spherical1080s30fps: [
        'spherical_vp9_1080s_30fps.webm', 36208240, 149.28,
        {'fps': 30, 'resolution': '1080p', 'spherical': true}
      ],
      Spherical1080s60fps: [
        'spherical_vp9_1080s_60fps.webm', 53176311, 149.29,
        {'fps': 60, 'resolution': '1080p', 'spherical': true}
      ],
      Spherical1440s30fps: [
        'spherical_vp9_1440s_30fps.webm', 98235300, 149.28,
        {'fps': 30, 'resolution': '1440p', 'spherical': true}
      ],
      Spherical1440s60fps: [
        'spherical_vp9_1440s_60fps.webm', 152948581, 149.29,
        {'fps': 60, 'resolution': '1440p', 'spherical': true}
      ],
      Spherical2160s30fps: [
        'spherical_vp9_2160s_30fps.webm', 243510558, 149.28,
        {'fps': 30, 'resolution': '2160p', 'spherical': true}
      ],
      Spherical2160s60fps: [
        'spherical_vp9_2160s_60fps.webm', 393625694, 149.29,
        {'fps': 60, 'resolution': '2160p', 'spherical': true}
      ],
    },
  };

  var streamTypes = [AAC, Opus, H264, VP9];

  var defaultWidth = {
    '144p': 256,
    '240p': 426,
    '360p': 640,
    '480p': 854,
    '720p': 1280,
    '1080p': 1920,
    '1440p': 2560,
    '2160p': 3840
  };

  var defaultHeight = {
    '144p': 144,
    '240p': 240,
    '360p': 360,
    '480p': 480,
    '720p': 720,
    '1080p': 1080,
    '1440p': 1440,
    '2160p': 2160
  };

  var createStreamDefFunc = function(codec, mediaType, mimeType) {
    return function(src, size, duration, customMap) {
      var get = function(attribute) {
        return attribute in customMap ? customMap[attribute] : null;
      };
      var mime = mimeType;
      if (!!customMap) {
        if (customMap.hasOwnProperty('mimeType')) mime = customMap['mimeType'];
        // Set default width and height based on resolution.
        if ('resolution' in customMap) {
          if (!('width' in customMap))
            customMap.width = defaultWidth[customMap['resolution']];
          if (!('height' in customMap))
            customMap.height = defaultHeight[customMap['resolution']];
        }
      }
      return {
        codec: codec,
        mediatype: mediaType,
        mimetype: mime,
        size: size,
        src: util.getMediaPath(src),
        duration: duration,
        bps: Math.floor(size / duration),
        customMap: customMap,
        get: get
      };
    };
  };

  var mediaStreams = {};
  for (var i in streamTypes) {
    var mimeType = streamTypes[i].mimetype;
    var mediaType = streamTypes[i].mediatype;
    var streamType = streamTypes[i].streamtype;
    mediaStreams[streamType] = {};
    mediaStreams[streamType].mimetype = mimeType;
    var createStreamDef = createStreamDefFunc(streamType, mediaType, mimeType);

    var streams = streamTypes[i].streams;
    for (var streamName in streams) {
      if (streams.hasOwnProperty(streamName)) {
        mediaStreams[streamType][streamName] =
            createStreamDef.apply(null, streams[streamName]);
      }
    }
  }

  return mediaStreams;
})();
