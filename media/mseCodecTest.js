/**
 * @license
 * Copyright 2019 Google Inc. All rights reserved.
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

/**
 * MSE Codec Test Suite.
 * @class
 */
var MsecodecTest = function() {

var mseVersion = 'Current Editor\'s Draft';
var webkitPrefix = MediaSource.prototype.version.indexOf('webkit') >= 0;
var tests = [];
var info = 'No MSE Support!';
if (window.MediaSource) {
  info = 'MSE Spec Version: ' + mseVersion;
  info += ' | webkit prefix: ' + webkitPrefix.toString();
}
info += ' | Default Timeout: ' + TestBase.timeout + 'ms';

var fields = ['passes', 'failures', 'timeouts'];

/**
 * @param {!string} name
 * @param {?string} category
 * @param {?boolean} mandatory
 * @param {?Array<Object>} streams If any stream is unsupported, test is marked
 *     optional and fails.
 */
var createCodecTest =
    function(name, category = 'General', mandatory = true, streams = []) {
  var t = createMSTest(name, category, mandatory);
  t.prototype.index = tests.length;
  t.prototype.setStreams(streams);
  tests.push(t);
  return t;
};

/**
 * Test appendBuffer for specified mimetype by appending twice in a row.
 * When the first append happens, the sourceBuffer becomes temporarily unusable
 * and it's updating should be set to true, which makes the second appends
 * unsuccessful and throws INVALID_STATE_ERR exception.
 * However, sometimes the update happens so fast that the second append manage
 * as well.
 */
var createAppendTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      'Append' + stream.codec + util.MakeCapitalName(stream.mediatype),
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test if we can append a whole ' +
      stream.mediatype + ' file whose size is 1MB.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);
    var xhr = runner.XHRManager.createRequest(stream.src, function(e) {
      var data = xhr.getResponseData();
      function updateEnd(e) {
        runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
        runner.checkEq(sb.buffered.start(0), 0, 'Range start');
        runner.checkApproxEq(sb.buffered.end(0), stream.duration, 'Range end');

        // Try appending twice in a row --
        // this should throw an INVALID_STATE_ERR exception.
        var caught = false;
        try {
          sb.removeEventListener('updateend', updateEnd);
          sb.appendBuffer(data);
          sb.appendBuffer(data);
        }
        catch (e) {
          if (e.code === e.INVALID_STATE_ERR) {
            runner.succeed();
          } else {
            runner.fail('Invalid error on double append: ' + e);
          }
          caught = true;
        }

        if (!caught) {
          // We may have updated so fast that we didn't encounter the error.
          if (sb.updating) {
            // Not a great check due to race conditions, but will have to do.
            runner.fail('Implementation did not throw INVALID_STATE_ERR.');
          } else {
            runner.succeed();
          }
        }
      }
      sb.addEventListener('updateend', updateEnd);
      sb.appendBuffer(data);
    });
    xhr.send();
  };
};

/**
 * Ensure sourceBuffer can abort current segment and end up with correct value.
 */
var createAbortTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      'Abort' + stream.codec + util.MakeCapitalName(stream.mediatype),
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test if we can abort the current segment.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);
    var xhr = runner.XHRManager.createRequest(stream.src, function(e) {
      var responseData = xhr.getResponseData();
      var abortEnded = function(e) {
        sb.removeEventListener('updateend', abortEnded);
        sb.addEventListener('update', function(e) {
          runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
          runner.checkEq(sb.buffered.start(0), 0, 'Range start');
          runner.checkGr(sb.buffered.end(0), 0, 'Range end');
          runner.succeed();
        });
        sb.appendBuffer(responseData);
      }
      var appendStarted = function(e) {
        sb.removeEventListener('update', appendStarted);
        sb.addEventListener('updateend', abortEnded);
        sb.abort();
      }
      sb.addEventListener('update', appendStarted);
      sb.appendBuffer(responseData);
    }, 0, stream.size);
    xhr.send();
  };
};

/**
 * Ensure timestamp offset can be set.
 */
var createTimestampOffsetTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      'TimestampOffset' + stream.codec +
          util.MakeCapitalName(stream.mediatype),
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test if we can set timestamp offset.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);
    var xhr = runner.XHRManager.createRequest(stream.src, function(e) {
      sb.timestampOffset = 5;
      sb.appendBuffer(xhr.getResponseData());
      sb.addEventListener('updateend', function() {
        runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
        runner.checkEq(sb.buffered.start(0), 5, 'Range start');
        runner.checkApproxEq(sb.buffered.end(0), stream.duration + 5,
                             'Range end');
        runner.succeed();
      });
    });
    xhr.send();
  };
};

/**
 * Test the sourceBuffer DASH switch latency.
 * Validate it's less than 1 second.
 */
var createDASHLatencyTest = function(videoStream, audioStream, mandatory) {
  var test = createCodecTest('DASHLatency' + videoStream.codec,
      'MSE (' + videoStream.codec + ')',
      mandatory,
      [videoStream, audioStream]);
  test.prototype.title = 'Test SourceBuffer DASH switch latency';
  test.prototype.onsourceopen = function() {
    var self = this;
    var runner = this.runner;
    var videoSb = this.ms.addSourceBuffer(videoStream.mimetype);
    var audioSb = this.ms.addSourceBuffer(audioStream.mimetype);
    var video = this.video;

    var videoXhr = runner.XHRManager.createRequest(videoStream.src,
        function(e) {
      var videoContent = videoXhr.getResponseData();
      var expectedTime = 0;
      var loopCount = 0;
      var MAX_ITER = 300;
      var OVERFLOW_OFFSET = 1.0;

      var onBufferFull = function() {
        var bufferSize = loopCount * videoStream.size / 1048576;
        self.log('Buffer size: ' + Math.round(bufferSize) + 'MB');

        var DASH_MAX_LATENCY = 1;
        var newContentStartTime = videoSb.buffered.start(0) + 2;
        self.log('Source buffer updated as exceeding buffer limit');

        video.addEventListener('timeupdate', function onTimeUpdate(e) {
          if (video.currentTime > newContentStartTime + DASH_MAX_LATENCY) {
            video.removeEventListener('timeupdate', onTimeUpdate);
            runner.succeed();
          }
        });
        video.play();
      }

      videoSb.addEventListener('update', function onUpdate() {
        expectedTime += videoStream.duration;
        videoSb.timestampOffset = expectedTime;
        loopCount++;

        if (loopCount > MAX_ITER) {
          videoSb.removeEventListener('update', onUpdate);
          runner.fail('Failed to fill up source buffer.');
          return;
        }

        // Fill up the buffer such that it overflow implementations.
        if (expectedTime > videoSb.buffered.end(0) + OVERFLOW_OFFSET) {
          videoSb.removeEventListener('update', onUpdate);
          onBufferFull();
        }
        try {
          videoSb.appendBuffer(videoContent);
        } catch (e) {
          videoSb.removeEventListener('update', onUpdate);
          var QUOTA_EXCEEDED_ERROR_CODE = 22;
          if (e.code == QUOTA_EXCEEDED_ERROR_CODE) {
            onBufferFull();
          } else {
            runner.fail(e);
          }
        }
      });
      videoSb.appendBuffer(videoContent);;
    });

    var audioXhr = runner.XHRManager.createRequest(audioStream.src,
        function(e) {
      var audioContent = audioXhr.getResponseData();
      audioSb.appendBuffer(audioContent);
      videoXhr.send();
    });
    audioXhr.send();
  };
};

/**
 * Ensure valid duration change after append buffer by halving the duration.
 */
var createDurationAfterAppendTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      'DurationAfterAppend' + stream.codec +
          util.MakeCapitalName(stream.mediatype),
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test if the duration expands after appending data.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var ms = this.ms;
    var sb = ms.addSourceBuffer(stream.mimetype);
    var unused_sb = ms.addSourceBuffer(unused_stream.mimetype);
    var self = this;

    var xhr = runner.XHRManager.createRequest(stream.src,
      function(e) {
        var data = xhr.getResponseData();

        var updateCb = function() {
          var halfDuration;
          var durationChanged = false;
          var sbUpdated = false;
          sb.removeEventListener('updateend', updateCb);
          sb.abort();

          if (sb.updating) {
            runner.fail();
            return;
          }

          media.addEventListener(
              'durationchange', function onDurationChange() {
            media.removeEventListener('durationchange', onDurationChange);
            self.log('Duration change complete.');
            runner.checkApproxEq(ms.duration, halfDuration, 'ms.duration');
            durationChanged = true;
            if (durationChanged && sbUpdated) {
              runner.succeed();
            }
          });

          halfDuration = sb.buffered.end(0) / 2;
          setDuration(halfDuration, ms, sb, function() {
            self.log('Remove() complete.');
            runner.checkApproxEq(ms.duration, halfDuration, 'ms.duration');
            runner.checkApproxEq(sb.buffered.end(0), halfDuration,
                                 'sb.buffered.end(0)');
            sb.addEventListener('updateend', function onUpdate() {
              sb.removeEventListener('updateend', onUpdate);
              runner.checkApproxEq(ms.duration, sb.buffered.end(0),
                                   'ms.duration');
              sbUpdated = true;
              if (durationChanged && sbUpdated) {
                runner.succeed();
              }
            });
            sb.appendBuffer(data);
          });
        };

        sb.addEventListener('updateend', updateCb);
        sb.appendBuffer(data);
      });
    xhr.send();
  };
};

/**
 * Test pause state before or after appending data to sourceBuffer.
 */
var createPausedTest = function(stream, mandatory) {
  var test = createCodecTest(
      'PausedStateWith' + stream.codec +
          util.MakeCapitalName(stream.mediatype),
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test if the paused state is correct before or ' +
      ' after appending data.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var ms = this.ms;
    var sb = ms.addSourceBuffer(stream.mimetype);

    runner.checkEq(media.paused, true, 'media.paused');

    var xhr = runner.XHRManager.createRequest(stream.src,
        function(e) {
      runner.checkEq(media.paused, true, 'media.paused');
      sb.appendBuffer(xhr.getResponseData());
      runner.checkEq(media.paused, true, 'media.paused');
      sb.addEventListener('updateend', function() {
        runner.checkEq(media.paused, true, 'media.paused');
        runner.succeed();
      });
    });
    xhr.send();
  };
};

/**
 * Test if video dimension is correct before or after appending data.
 */
var createVideoDimensionTest = function(videoStream, audioStream, mandatory) {
  var test = createCodecTest('VideoDimension' + videoStream.codec,
      'MSE (' + videoStream.codec + ')',
      mandatory,
      [videoStream, audioStream]);
  test.prototype.title =
      'Test if video dimension is correct before or after appending data.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var videoChain = new ResetInit(new FixedAppendSize(
        new FileSource(videoStream.src, runner.XHRManager, runner.timeouts),
        65536));
    var videoSb = this.ms.addSourceBuffer(videoStream.mimetype);
    var audioSb = this.ms.addSourceBuffer(audioStream.mimetype);
    var self = this;

    runner.checkEq(media.videoWidth, 0, 'video width');
    runner.checkEq(media.videoHeight, 0, 'video height');

    var totalSuccess = 0;
    function checkSuccess() {
      totalSuccess++;
      if (totalSuccess == 2)
        runner.succeed();
    }

    media.addEventListener('loadedmetadata', function(e) {
      self.log('loadedmetadata called');
      runner.checkEq(media.videoWidth, 640, 'video width');
      runner.checkEq(media.videoHeight, 360, 'video height');
      checkSuccess();
    });

    runner.checkEq(media.readyState, media.HAVE_NOTHING, 'readyState');
    var audioXhr = runner.XHRManager.createRequest(audioStream.src,
        function(e) {
      var audioContent = audioXhr.getResponseData();
      audioSb.appendBuffer(audioContent);
      appendInit(media, videoSb, videoChain, 0, checkSuccess);
    });
    audioXhr.send();
  };
};

/**
 * Test if the playback state transition is correct.
 */
var createPlaybackStateTest = function(stream, mandatory) {
  var test = createCodecTest('PlaybackState' + stream.codec,
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test if the playback state transition is correct.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var videoStream = stream;
    var audioStream = Media.AAC.AudioTiny;
    var videoChain = new ResetInit(new FixedAppendSize(
        new FileSource(videoStream.src, runner.XHRManager, runner.timeouts),
        65536));
    var videoSb = this.ms.addSourceBuffer(videoStream.mimetype);
    var audioChain = new ResetInit(new FixedAppendSize(
        new FileSource(audioStream.src, runner.XHRManager, runner.timeouts),
        65536));
    var audioSb = this.ms.addSourceBuffer(audioStream.mimetype);
    var self = this;

    media.play();
    runner.checkEq(media.currentTime, 0, 'media.currentTime');
    media.pause();
    runner.checkEq(media.currentTime, 0, 'media.currentTime');

    appendInit(media, audioSb, audioChain, 0, function() {
      appendInit(media, videoSb, videoChain, 0, function() {
        callAfterLoadedMetaData(media, function() {
          media.play();
          runner.checkEq(media.currentTime, 0, 'media.currentTime');
          media.pause();
          runner.checkEq(media.currentTime, 0, 'media.currentTime');
          media.play();
          appendUntil(
              runner.timeouts, media, audioSb, audioChain, 5, function() {
            appendUntil(
                runner.timeouts, media, videoSb, videoChain, 5, function() {
              playThrough(runner.timeouts, media, 1, 2, audioSb,
                          audioChain, videoSb, videoChain, function() {
                var time = media.currentTime;
                media.pause();
                runner.checkApproxEq(
                    media.currentTime, time, 'media.currentTime');
                runner.succeed();
              });
            });
          });
        });
      });
    });
  };
};

/**
 * Ensure we can play a partially appended video segment.
 */
var createPlayPartialSegmentTest = function(stream, mandatory) {
  var test = createCodecTest('PlayPartial' + stream.codec + 'Segment',
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title =
      'Test if we can play a partially appended video segment.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var video = this.video;
    var videoStream = stream;
    var audioStream = Media.AAC.AudioTiny;
    var videoSb = this.ms.addSourceBuffer(videoStream.mimetype);
    var audioSb = this.ms.addSourceBuffer(audioStream.mimetype);
    var videoXhr = runner.XHRManager.createRequest(
        videoStream.src, function(e) {
      videoSb.appendBuffer(this.getResponseData());
      video.addEventListener('timeupdate', function(e) {
        if (!video.paused && video.currentTime >= 2) {
          runner.succeed();
        }
      });
      video.play();
    }, 0, 1500000);
    var audioXhr = runner.XHRManager.createRequest(
        audioStream.src, function(e) {
      audioSb.appendBuffer(this.getResponseData());
      videoXhr.send();
    }, 0, 500000);
    audioXhr.send();
  };
};

/**
 * Ensure we can play a partially appended audio segment.
 */
var createIncrementalAudioTest = function(stream) {
  var test = createCodecTest('Incremental' + stream.codec + 'Audio',
      'MSE (' + stream.codec + ')',
      true,
      [stream]);
  test.prototype.title =
      'Test if we can play a partially appended audio segment.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(Media.VP9.mimetype);
    var xhr = runner.XHRManager.createRequest(stream.src, function(e) {
      sb.appendBuffer(xhr.getResponseData());
      sb.addEventListener('updateend', function() {
        runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
        runner.checkEq(sb.buffered.start(0), 0, 'Range start');
        runner.checkApproxEq(
            sb.buffered.end(0), stream.get(200000), 'Range end');
        runner.succeed();
      });
    }, 0, 200000);
    xhr.send();
  };
};

/**
 * Ensure we can append audio data with an explicit offset.
 */
var createAppendAudioOffsetTest = function(stream1, stream2) {
  var test = createCodecTest('Append' + stream1.codec + 'AudioOffset',
      'MSE (' + stream1.codec + ')',
      true,
      [stream1, stream2]);
  test.prototype.title =
      'Test if we can append audio data with an explicit offset.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var video = this.video;
    var unused_sb = this.ms.addSourceBuffer(Media.VP9.mimetype);
    var sb = this.ms.addSourceBuffer(stream1.mimetype);
    var xhr = runner.XHRManager.createRequest(stream1.src, function(e) {
      sb.timestampOffset = 5;
      sb.appendBuffer(this.getResponseData());
      sb.addEventListener('updateend', function callXhr2() {
        sb.removeEventListener('updateend', callXhr2);
        xhr2.send();
      });
    }, 0, 200000);
    var xhr2 = runner.XHRManager.createRequest(stream2.src, function(e) {
      sb.abort();
      sb.timestampOffset = 0;
      sb.appendBuffer(this.getResponseData());
      sb.addEventListener('updateend', function() {
        runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
        runner.checkEq(sb.buffered.start(0), 0, 'Range start');
        runner.checkApproxEq(
            sb.buffered.end(0), stream2.get('appendAudioOffset'), 'Range end');
        runner.succeed();
      });
    }, 0, 200000);
    xhr.send();
  };
};

/**
 * Ensure we can append video data with an explicit offset.
 */
var createAppendVideoOffsetTest = function(stream1, stream2, audioStream, mandatory) {
  var test = createCodecTest('Append' + stream1.codec + 'VideoOffset',
      'MSE (' + stream1.codec + ')',
      mandatory,
      [stream1, stream2]);
  test.prototype.title =
      'Test if we can append video data with an explicit offset.';
  test.prototype.onsourceopen = function() {
    var self = this;
    var runner = this.runner;
    var video = this.video;
    var sb = this.ms.addSourceBuffer(stream1.mimetype);
    var audioSb = this.ms.addSourceBuffer(audioStream.mimetype);
    var xhr = runner.XHRManager.createRequest(stream1.src, function(e) {
      sb.timestampOffset = 5;
      sb.appendBuffer(this.getResponseData());
      sb.addEventListener('update', function callXhr2() {
        sb.removeEventListener('update', callXhr2);
        xhr2.send();
      });
    }, 0, 200000);
    var xhr2 = runner.XHRManager.createRequest(stream2.src, function(e) {
      sb.abort();
      sb.timestampOffset = 0;
      sb.appendBuffer(this.getResponseData());
      sb.addEventListener('updateend', function() {
        runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
        runner.checkEq(sb.buffered.start(0), 0, 'Range start');
        runner.checkApproxEq(sb.buffered.end(0),
            stream2.get('videoChangeRate'), 'Range end');
        callAfterLoadedMetaData(video, function() {
          video.addEventListener('seeked', function(e) {
            self.log('seeked called');
            video.addEventListener('timeupdate', function(e) {
              self.log('timeupdate called with ' + video.currentTime);
              if (!video.paused && video.currentTime >= 6) {
                runner.succeed();
              }
            });
          });
          video.currentTime = 6;
        });
      });
      video.play();
    }, 0, 400000);
    this.ms.duration = 100000000;  // Ensure that we can seek to any position.
    var audioXhr = runner.XHRManager.createRequest(audioStream.src,
        function(e) {
      var audioContent = audioXhr.getResponseData();
      audioSb.appendBuffer(audioContent);
      xhr.send();
    });
    audioXhr.send();
  };
};

/**
 * Ensure we can append multiple init segments.
 */
var createAppendMultipleInitTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      'AppendMultipleInit' + stream.codec +
          util.MakeCapitalName(stream.mediatype),
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test if we can append multiple init segments.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var chain = new FileSource(stream.src, runner.XHRManager, runner.timeouts,
                               0, stream.size, stream.size);
    var src = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);
    var init;

    function getEventAppend(cb, endCb) {
      var chainCount = 0;
      return function() {
        if (chainCount < 10) {
          ++chainCount;
          cb();
        } else {
          endCb();
        }
      };
    }

    chain.init(0, function(buf) {
      init = buf;
      chain.pull(function(buf) {
        var firstAppend = getEventAppend(function() {
            src.appendBuffer(init);
        }, function() {
          src.removeEventListener('update', firstAppend);
          src.addEventListener('update', function abortAppend() {
            src.removeEventListener('update', abortAppend);
            src.abort();
            var end = src.buffered.end(0);

            var secondAppend = getEventAppend(function() {
              src.appendBuffer(init);
            }, function() {
              runner.checkEq(src.buffered.end(0), end, 'Range end');
              runner.succeed();
            });
            src.addEventListener('update', secondAppend);
            secondAppend();
          });
          src.appendBuffer(buf);
        });
        src.addEventListener('update', firstAppend);
        firstAppend();
      });
    });
  };
};

/**
 * Test appending segments out of order.
 */
var createAppendOutOfOrderTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      'Append' + stream.codec + util.MakeCapitalName(stream.mediatype) +
          'OutOfOrder',
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test appending segments out of order.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var chain = new FileSource(stream.src, runner.XHRManager, runner.timeouts);
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);
    var bufs = [];

    var i = 0;
    // Append order of the segments.
    var appendOrder = [0, 2, 1, 4, 3];
    // Number of segments given the append order, since segments get merged.
    var bufferedLength = [0, 1, 1, 2, 1];

    sb.addEventListener('updateend', function() {
      runner.checkEq(sb.buffered.length, bufferedLength[i],
          'Source buffer number');
      if (i == 1) {
        runner.checkGr(sb.buffered.start(0), 0, 'Range start');
      } else if (i > 0) {
        runner.checkEq(sb.buffered.start(0), 0, 'Range start');
      }

      i++;
      if (i >= bufs.length) {
        runner.succeed();
      } else {
        sb.appendBuffer(bufs[appendOrder[i]]);
      }
    });

    chain.init(0, function(buf) {
      bufs.push(buf);
      chain.pull(function(buf) {
        bufs.push(buf);
        chain.pull(function(buf) {
          bufs.push(buf);
          chain.pull(function(buf) {
            bufs.push(buf);
            chain.pull(function(buf) {
              bufs.push(buf);
              sb.appendBuffer(bufs[0]);
            });
          });
        });
      });
    });
  };
};

/**
 * Test SourceBuffer.buffered get updated correctly after feeding data.
 */
var createBufferedRangeTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      'BufferedRange' + stream.codec + util.MakeCapitalName(stream.mediatype),
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title =
      'Test SourceBuffer.buffered get updated correctly after feeding data.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var chain = new ResetInit(
        new FileSource(stream.src, runner.XHRManager, runner.timeouts));
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);

    runner.checkEq(sb.buffered.length, 0, 'Source buffer number');
    appendInit(media, sb, chain, 0, function() {
      runner.checkEq(sb.buffered.length, 0, 'Source buffer number');
      appendUntil(runner.timeouts, media, sb, chain, 5, function() {
        runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
        runner.checkEq(sb.buffered.start(0), 0, 'Source buffer number');
        runner.checkGE(sb.buffered.end(0), 5, 'Range end');
        runner.succeed();
      });
    });
  };
};

/**
 * Ensure the duration on MediaSource can be set and retrieved sucessfully.
 */
var createMediaSourceDurationTest =
    function(videoStream, audioStream, mandatory) {
  var test = createCodecTest('MediaSourceDuration' + videoStream.codec,
      'MSE (' + videoStream.codec + ')',
      mandatory,
      [videoStream, audioStream]);
  test.prototype.title = 'Test if the duration on MediaSource can be set ' +
      'and retrieved sucessfully.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var ms = this.ms;
    var videoChain = new ResetInit(
        new FileSource(videoStream.src, runner.XHRManager, runner.timeouts));
    var videoSb = this.ms.addSourceBuffer(videoStream.mimetype);
    var audioSb = this.ms.addSourceBuffer(audioStream.mimetype);
    var self = this;
    var onsourceclose = function() {
      self.log('onsourceclose called');
      runner.assert(isNaN(ms.duration));
      runner.succeed();
    };

    var appendVideo = function() {
      runner.assert(isNaN(media.duration), 'Initial media duration not NaN');
      media.play();
      appendInit(media, videoSb, videoChain, 0, function() {
        var halfDuration = 5;
        var fullDuration = halfDuration * 2;
        var eps = 0.5;
        appendUntil(runner.timeouts, media, videoSb, videoChain, fullDuration,
            function() {
          setDuration(halfDuration, ms, [videoSb, audioSb], function() {
            runner.checkApproxEq(ms.duration, halfDuration, 'ms.duration', eps);
            runner.checkApproxEq(media.duration, halfDuration, 'media.duration',
                eps);
            runner.checkLE(videoSb.buffered.end(0), halfDuration + 0.1,
                'Range end');
            videoSb.abort();
            videoChain.seek(0);
            appendInit(media, videoSb, videoChain, 0, function() {
              appendUntil(runner.timeouts, media, videoSb, videoChain,
                  fullDuration, function() {
                runner.checkApproxEq(ms.duration, fullDuration, 'ms.duration',
                    eps * 2);
                setDuration(halfDuration, ms, [videoSb, audioSb], function() {
                  if (videoSb.updating) {
                    runner.fail(
                        'Source buffer is updating on duration change');
                    return;
                  }
                  var duration = videoSb.buffered.end(0);
                  ms.endOfStream();
                  runner.checkApproxEq(ms.duration, duration, 'ms.duration',
                                       0.01);
                  ms.addEventListener('sourceended', function() {
                    runner.checkApproxEq(ms.duration, duration, 'ms.duration',
                                         0.01);
                    runner.checkEq(media.duration, duration, 'media.duration');
                    ms.addEventListener('sourceclose', onsourceclose);
                    media.removeAttribute('src');
                    media.load();
                  });
                  media.play();
                });
              });
            });
          });
        });
      });
    };

    var audioXhr = runner.XHRManager.createRequest(audioStream.src,
        function(e) {
      audioSb.addEventListener('updateend', function onAudioUpdate() {
        audioSb.removeEventListener('updateend', onAudioUpdate);
        appendVideo();
      });
      var audioContent = audioXhr.getResponseData();
      audioSb.appendBuffer(audioContent);
    });
    audioXhr.send();
  };
};

/**
 * Validate media data with overlap is merged into one range.
 */
var createOverlapTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      stream.codec + util.MakeCapitalName(stream.mediatype) + 'WithOverlap',
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title =
      'Test if media data with overlap will be merged into one range.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var chain = new ResetInit(
        new FileSource(stream.src, runner.XHRManager, runner.timeouts));
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);
    var GAP = 0.1;

    appendInit(media, sb, chain, 0, function() {
      chain.pull(function(buf) {
        sb.addEventListener('update', function appendOuter() {
          sb.removeEventListener('update', appendOuter);
          runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
          var segmentDuration = sb.buffered.end(0);
          sb.timestampOffset = segmentDuration - GAP;
          chain.seek(0);
          chain.pull(function(buf) {
            sb.addEventListener('update', function appendMiddle() {
              sb.removeEventListener('update', appendMiddle);
              chain.pull(function(buf) {
                sb.addEventListener('update', function appendInner() {
                  runner.checkEq(
                      sb.buffered.length, 1, 'Source buffer number');
                  runner.checkApproxEq(sb.buffered.end(0),
                                       segmentDuration * 2 - GAP, 'Range end');
                  runner.succeed();
                });
                runner.assert(safeAppend(sb, buf), 'safeAppend failed');
              });
            });
            runner.assert(safeAppend(sb, buf), 'safeAppend failed');
          });
        });
        runner.assert(safeAppend(sb, buf), 'safeAppend failed');
      });
    });
  };
};

/**
 * Validate media data with a gap smaller than an media frame size is merged
 * into one buffered range.
 */
var createSmallGapTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      stream.codec + util.MakeCapitalName(stream.mediatype) + 'WithSmallGap',
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title =
      'Test if media data with a gap smaller than an media frame size ' +
      'will be merged into one buffered range.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var chain = new ResetInit(
        new FileSource(stream.src, runner.XHRManager, runner.timeouts));
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);
    var GAP = 0.01;

    appendInit(media, sb, chain, 0, function() {
      chain.pull(function(buf) {
        sb.addEventListener('update', function appendOuter() {
          sb.removeEventListener('update', appendOuter);
          runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
          var segmentDuration = sb.buffered.end(0);
          sb.timestampOffset = segmentDuration + GAP;
          chain.seek(0);
          chain.pull(function(buf) {
            sb.addEventListener('update', function appendMiddle() {
              sb.removeEventListener('update', appendMiddle);
              chain.pull(function(buf) {
                sb.addEventListener('update', function appendInner() {
                  runner.checkEq(
                      sb.buffered.length, 1, 'Source buffer number');
                  runner.checkApproxEq(sb.buffered.end(0),
                      segmentDuration * 2 + GAP, 'Range end');
                  runner.succeed();
                });
                runner.assert(safeAppend(sb, buf), 'safeAppend failed');
              });
            });
            runner.assert(safeAppend(sb, buf), 'safeAppend failed');
          });
        });
        runner.assert(safeAppend(sb, buf), 'safeAppend failed');
      });
    });
  };
};

/**
 * Validate media data with a gap larger than an media frame size will not be
 * merged into one buffered range.
 */
var createLargeGapTest = function(stream, unused_stream, mandatory) {
  var test = createCodecTest(
      stream.codec + util.MakeCapitalName(stream.mediatype) + 'WithLargeGap',
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title =
      'Test if media data with a gap larger than an media frame size ' +
      'will not be merged into one buffered range.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var chain = new ResetInit(
        new FileSource(stream.src, runner.XHRManager, runner.timeouts));
    var sb = this.ms.addSourceBuffer(stream.mimetype);
    var unused_sb = this.ms.addSourceBuffer(unused_stream.mimetype);
    var GAP = 0.3;

    appendInit(media, sb, chain, 0, function() {
      chain.pull(function(buf) {
        sb.addEventListener('update', function appendOuter() {
          sb.removeEventListener('update', appendOuter);
          runner.checkEq(sb.buffered.length, 1, 'Source buffer number');
          var segmentDuration = sb.buffered.end(0);
          sb.timestampOffset = segmentDuration + GAP;
          chain.seek(0);
          chain.pull(function(buf) {
            sb.addEventListener('update', function appendMiddle() {
              sb.removeEventListener('update', appendMiddle);
              chain.pull(function(buf) {
                sb.addEventListener('update', function appendInner() {
                  runner.checkEq(
                      sb.buffered.length, 2, 'Source buffer number');
                  runner.succeed();
                });
                runner.assert(safeAppend(sb, buf), 'safeAppend failed');
              });
            });
            runner.assert(safeAppend(sb, buf), 'safeAppend failed');
          });
        });
        runner.assert(safeAppend(sb, buf), 'safeAppend failed');
      });
    });
  };
};

/**
 * Validate we can seek during playing. It also tests if the implementation
 * properly supports seek operation fired immediately after another seek that
 * hasn't been completed.
 */
var createSeekTest = function(videoStream, mandatory) {
  var test = createCodecTest('Seek' + videoStream.codec,
      'MSE (' + videoStream.codec + ')',
      mandatory,
      [videoStream]);
  test.prototype.title = 'Test if we can seek during playing. It' +
      ' also tests if the implementation properly supports seek operation' +
      ' fired immediately after another seek that hasn\'t been completed.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var audioStream = Media.AAC.AudioNormal;
    var videoChain = new ResetInit(new FileSource(
        videoStream.src, runner.XHRManager, runner.timeouts));
    var videoSb = this.ms.addSourceBuffer(videoStream.mimetype);
    var audioChain = new ResetInit(new FileSource(
        audioStream.src, runner.XHRManager, runner.timeouts));
    var audioSb = this.ms.addSourceBuffer(audioStream.mimetype);
    var self = this;

    this.ms.duration = 100000000;  // Ensure that we can seek to any position.

    appendUntil(runner.timeouts, media, videoSb, videoChain, 20, function() {
      appendUntil(runner.timeouts, media, audioSb, audioChain, 20, function() {
        self.log('Seek to 17s');
        callAfterLoadedMetaData(media, function() {
          media.currentTime = 17;
          media.play();
          playThrough(
              runner.timeouts, media, 10, 19,
              videoSb, videoChain, audioSb, audioChain, function() {
            runner.checkGE(media.currentTime, 19, 'currentTime');
            self.log('Seek to 28s');
            media.currentTime = 53;
            media.currentTime = 58;
            playThrough(
                runner.timeouts, media, 10, 60,
                videoSb, videoChain, audioSb, audioChain, function() {
              runner.checkGE(media.currentTime, 60, 'currentTime');
              self.log('Seek to 7s');
              media.currentTime = 0;
              media.currentTime = 7;
              videoChain.seek(7, videoSb);
              audioChain.seek(7, audioSb);
              playThrough(runner.timeouts, media, 10, 9,
                  videoSb, videoChain, audioSb, audioChain, function() {
                runner.checkGE(media.currentTime, 9, 'currentTime');
                runner.succeed();
              });
            });
          });
        });
      });
    });
  };
};

/**
 * Seek into and out of a buffered region.
 */
var createBufUnbufSeekTest = function(videoStream, mandatory) {
  var test = createCodecTest('BufUnbufSeek' + videoStream.codec,
      'MSE (' + videoStream.codec + ')',
      mandatory,
      [videoStream]);
  test.prototype.title = 'Seek into and out of a buffered region.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    var audioStream = Media.AAC.AudioNormal;
    var videoSb = this.ms.addSourceBuffer(videoStream.mimetype);
    var audioSb = this.ms.addSourceBuffer(audioStream.mimetype);
    var xhr = runner.XHRManager.createRequest(videoStream.src, function() {
      videoSb.appendBuffer(xhr.getResponseData());
      var xhr2 = runner.XHRManager.createRequest(audioStream.src, function() {
        audioSb.appendBuffer(xhr2.getResponseData());
        callAfterLoadedMetaData(media, function() {
          var N = 30;
          function loop(i) {
            if (i > N) {
              media.currentTime = 1.005;
              media.addEventListener('timeupdate', function(e) {
                if (!media.paused && media.currentTime > 3)
                  runner.succeed();
              });
              return;
            }
            media.currentTime = (i++ % 2) * 1.0e6 + 1;
            runner.timeouts.setTimeout(loop.bind(null, i), 50);
          }
          media.play();
          media.addEventListener('play', loop.bind(null, 0));
        });
      }, 0, 100000);
      xhr2.send();
    }, 0, 1000000);
    this.ms.duration = 100000000;  // Ensure that we can seek to any position.
    xhr.send();
  };
};

/**
 * Ensure we can play properly when there is not enough audio or video data.
 * The play should resume once src data is appended.
 */
var createDelayedTest = function(delayed, nonDelayed, mandatory) {
  var test = createCodecTest(
      'Delayed' + delayed.codec + util.MakeCapitalName(delayed.mediatype),
      'MSE (' + delayed.codec + ')',
      mandatory,
      [delayed, nonDelayed]);
  test.prototype.title = 'Test if we can play properly when there' +
      ' is not enough ' + delayed.mediatype +
      ' data. The play should resume once ' +
      delayed.mediatype + ' data is appended.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var media = this.video;
    // Chrome allows for 3 seconds of underflow for streams that have audio
    // but are video starved.
    // See code.google.com/p/chromium/issues/detail?id=423801
    var underflowTime = 0.0;
    if (delayed.mediatype == 'video') {
      underflowTime = 3.0;
    }
    var chain = new FixedAppendSize(
      new ResetInit(
        new FileSource(nonDelayed.src, runner.XHRManager, runner.timeouts)
      ), 16384);
    var src = this.ms.addSourceBuffer(nonDelayed.mimetype);
    var delayedChain = new FixedAppendSize(
      new ResetInit(
        new FileSource(delayed.src, runner.XHRManager, runner.timeouts)
      ), 16384);
    var delayedSrc = this.ms.addSourceBuffer(delayed.mimetype);
    var self = this;
    var ontimeupdate = function(e) {
      if (!media.paused) {
        var end = delayedSrc.buffered.end(0);
        runner.checkLE(media.currentTime, end + 1.0 + underflowTime,
          'media.currentTime (' + media.readyState + ')');
      }
    };

    appendUntil(runner.timeouts, media, src, chain, 15, function() {
      appendUntil(runner.timeouts, media, delayedSrc, delayedChain, 8,
                  function() {
        var end = delayedSrc.buffered.end(0);
        self.log('Start play when there is only ' + end + ' seconds of ' +
                 test.prototype.desc + ' data.');
        media.play();
        media.addEventListener('timeupdate', ontimeupdate);
        waitUntil(runner.timeouts, media, end + 3, function() {
          runner.checkLE(media.currentTime, end + 1.0 + underflowTime,
              'media.currentTime');
          runner.checkGr(media.currentTime, end - 1.0 - underflowTime,
              'media.currentTime');
          runner.succeed();
        });
      });
    });
  };
};

/**
 * Test to check if audio-less or audio-only can be playback properly.
 */
var createSingleSourceBufferPlaybackTest = function(stream, mandatory) {
  var test = createCodecTest(
      'PlaybackOnly' + stream.codec + util.MakeCapitalName(stream.mediatype),
      'MSE (' + stream.codec + ')',
      mandatory,
      [stream]);
  test.prototype.title = 'Test if we can playback a single source buffer.';
  test.prototype.onsourceopen = function() {
    var runner = this.runner;
    var video = this.video;
    var videoSb = this.ms.addSourceBuffer(stream.mimetype);
    var videoXhr = runner.XHRManager.createRequest(stream.src, function(e) {
      videoSb.appendBuffer(this.getResponseData());
      video.addEventListener('timeupdate', function(e) {
        if (video.currentTime > 5) {
          runner.succeed();
        }
      });
      video.play();
    }, 0, 300000);
    videoXhr.send();
  };
};

// Opus Specific tests.
createAppendTest(Media.Opus.SantaHigh, Media.VP9.Video1MB);
createAbortTest(Media.Opus.SantaHigh, Media.VP9.Video1MB);
createTimestampOffsetTest(Media.Opus.CarLow, Media.VP9.Video1MB);
createDurationAfterAppendTest(Media.Opus.CarLow, Media.VP9.Video1MB);
createPausedTest(Media.Opus.CarLow);
createIncrementalAudioTest(Media.Opus.CarMed);
createAppendAudioOffsetTest(Media.Opus.CarMed, Media.Opus.CarHigh);
createAppendMultipleInitTest(Media.Opus.CarLow, Media.VP9.Video1MB);
createAppendOutOfOrderTest(Media.Opus.CarMed, Media.VP9.Video1MB);
createBufferedRangeTest(Media.Opus.CarMed, Media.VP9.Video1MB);
createOverlapTest(Media.Opus.CarMed, Media.VP9.Video1MB);
createSmallGapTest(Media.Opus.CarMed, Media.VP9.Video1MB);
createLargeGapTest(Media.Opus.CarMed, Media.VP9.Video1MB);
createDelayedTest(Media.Opus.CarMed, Media.VP9.VideoNormal);
createSingleSourceBufferPlaybackTest(Media.Opus.SantaHigh)

// AAC Specific tests.
createAppendTest(Media.AAC.Audio1MB, Media.H264.Video1MB);
createAbortTest(Media.AAC.Audio1MB, Media.H264.Video1MB);
createTimestampOffsetTest(Media.AAC.Audio1MB, Media.H264.Video1MB);
createDurationAfterAppendTest(Media.AAC.Audio1MB, Media.H264.Video1MB);
createPausedTest(Media.AAC.Audio1MB);
createIncrementalAudioTest(Media.AAC.AudioNormal, Media.H264.Video1MB);
createAppendAudioOffsetTest(Media.AAC.AudioNormal, Media.AAC.AudioHuge);
createAppendMultipleInitTest(Media.AAC.Audio1MB, Media.H264.Video1MB);
createAppendOutOfOrderTest(Media.AAC.AudioNormal, Media.H264.Video1MB);
createBufferedRangeTest(Media.AAC.AudioNormal, Media.H264.Video1MB);
createOverlapTest(Media.AAC.AudioNormal, Media.H264.Video1MB);
createSmallGapTest(Media.AAC.AudioNormal, Media.H264.Video1MB);
createLargeGapTest(Media.AAC.AudioNormal, Media.H264.Video1MB);
createDelayedTest(Media.AAC.AudioNormal, Media.VP9.VideoNormal);
createSingleSourceBufferPlaybackTest(Media.AAC.Audio1MB)

// VP9 Specific tests.
createAppendTest(Media.VP9.Video1MB, Media.AAC.Audio1MB);
createAbortTest(Media.VP9.Video1MB, Media.AAC.Audio1MB);
createTimestampOffsetTest(Media.VP9.Video1MB, Media.AAC.Audio1MB);
createDASHLatencyTest(Media.VP9.VideoTiny, Media.AAC.Audio1MB);
createDurationAfterAppendTest(Media.VP9.Video1MB, Media.AAC.Audio1MB);
createPausedTest(Media.VP9.Video1MB);
createVideoDimensionTest(Media.VP9.VideoNormal, Media.AAC.AudioNormal);
createPlaybackStateTest(Media.VP9.VideoNormal);
createPlayPartialSegmentTest(Media.VP9.VideoTiny);
createAppendVideoOffsetTest(
    Media.VP9.VideoNormal, Media.VP9.VideoTiny, Media.AAC.AudioNormal);
createAppendMultipleInitTest(Media.VP9.Video1MB, Media.AAC.Audio1MB);
createAppendOutOfOrderTest(Media.VP9.VideoNormal, Media.AAC.AudioNormal);
createBufferedRangeTest(Media.VP9.VideoNormal, Media.AAC.AudioNormal);
createMediaSourceDurationTest(Media.VP9.VideoNormal, Media.AAC.AudioNormal);
createOverlapTest(Media.VP9.VideoNormal, Media.AAC.AudioNormal);
createSmallGapTest(Media.VP9.VideoNormal, Media.AAC.AudioNormal);
createLargeGapTest(Media.VP9.VideoNormal, Media.AAC.AudioNormal);
createSeekTest(Media.VP9.VideoNormal);
createBufUnbufSeekTest(Media.VP9.VideoNormal);
createDelayedTest(Media.VP9.VideoNormal, Media.AAC.AudioNormal);
createSingleSourceBufferPlaybackTest(Media.VP9.VideoTiny)

// H264 Specific tests.
createAppendTest(Media.H264.Video1MB, Media.AAC.Audio1MB);
createAbortTest(Media.H264.Video1MB, Media.AAC.Audio1MB);
createTimestampOffsetTest(Media.H264.Video1MB, Media.AAC.Audio1MB);
createDASHLatencyTest(Media.H264.VideoTiny, Media.AAC.Audio1MB);
createDurationAfterAppendTest(Media.H264.Video1MB, Media.AAC.Audio1MB);
createPausedTest(Media.H264.Video1MB);
createVideoDimensionTest(Media.H264.VideoNormal, Media.AAC.Audio1MB);
createPlaybackStateTest(Media.H264.VideoNormal);
createPlayPartialSegmentTest(Media.H264.VideoTiny);
createAppendVideoOffsetTest(
    Media.H264.VideoNormal, Media.H264.VideoTiny, Media.AAC.Audio1MB);
createAppendMultipleInitTest(Media.H264.Video1MB, Media.AAC.Audio1MB);
createAppendOutOfOrderTest(Media.H264.CarMedium, Media.AAC.Audio1MB);
createBufferedRangeTest(Media.H264.VideoNormal, Media.AAC.Audio1MB);
createMediaSourceDurationTest(Media.H264.VideoNormal, Media.AAC.Audio1MB);
createOverlapTest(Media.H264.VideoNormal, Media.AAC.Audio1MB);
createSmallGapTest(Media.H264.VideoNormal, Media.AAC.Audio1MB);
createLargeGapTest(Media.H264.VideoNormal, Media.AAC.Audio1MB);
createSeekTest(Media.H264.VideoNormal);
createBufUnbufSeekTest(Media.H264.VideoNormal);
createDelayedTest(Media.H264.VideoNormal, Media.AAC.AudioNormal);
createSingleSourceBufferPlaybackTest(Media.H264.VideoTiny)

// AV1 Specific tests.
createAppendTest(Media.AV1.Bunny144p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createAbortTest(Media.AV1.Bunny144p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createTimestampOffsetTest(Media.AV1.Bunny144p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createDASHLatencyTest(Media.AV1.Bunny240p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createDurationAfterAppendTest(Media.AV1.Bunny144p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createPausedTest(Media.AV1.Bunny144p30fps, util.requireAV1());
createVideoDimensionTest(Media.AV1.Bunny360p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createPlaybackStateTest(Media.AV1.Bunny360p30fps, util.requireAV1());
createPlayPartialSegmentTest(Media.AV1.Bunny240p30fps, util.requireAV1());
createAppendVideoOffsetTest(Media.AV1.Bunny360p30fps, Media.AV1.Bunny240p30fps,
    Media.AAC.Audio1MB, util.requireAV1());
createAppendMultipleInitTest(Media.AV1.Bunny144p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createAppendOutOfOrderTest(Media.AV1.Bunny360p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createBufferedRangeTest(Media.AV1.Bunny360p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createMediaSourceDurationTest(Media.AV1.Bunny360p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createOverlapTest(Media.AV1.Bunny360p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createSmallGapTest(Media.AV1.Bunny360p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createLargeGapTest(Media.AV1.Bunny360p30fps, Media.AAC.Audio1MB,
    util.requireAV1());
createSeekTest(Media.AV1.Bunny360p30fps, util.requireAV1());
createBufUnbufSeekTest(Media.AV1.Bunny360p30fps, util.requireAV1());
createDelayedTest(Media.AV1.Bunny360p30fps, Media.AAC.AudioNormal,
    util.requireAV1());
createSingleSourceBufferPlaybackTest(Media.AV1.Bunny240p30fps, util.requireAV1());

return {tests: tests, info: info, fields: fields, viewType: 'default'};

};
