/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import fileIcon from "./file.png";
import folderIcon from "./folder.png";
import startingGif from "./starting.png";
import "./App.css";
import ReactPlayer from "react-player";
import _ from "lodash";
import Duration from "./Duration";
import screenfull from "screenfull";
import { Link, useHistory } from "react-router-dom";

const Home = () => {
  const playerRef = useRef(null);
  const currentRef = useRef(null);
  let history = useHistory();
  let hostname = window.location.hostname;
  let rootPath = decodeURIComponent(window.location.pathname);
  const fullPathRoot = _.filter(rootPath.split("/"), (root) => !!root);
  let root = _.first(fullPathRoot) || "";
  let fileNameUrl = _.last(fullPathRoot) || "";
  let pathName = _.drop(_.clone(fullPathRoot)).join("/");
  let backRootPath = _.dropRight(_.clone(fullPathRoot)).join("/");
  let backPath = _.dropRight(_.drop(_.clone(fullPathRoot))).join("/");
  let pathViewFile = fullPathRoot.join("/");

  const queryParams = new URLSearchParams(window.location.search);
  const type = queryParams.get("type");
  const publicURL = `http://${hostname}:8081/public/`;
  const subtitlesURL = `http://${hostname}:8081/subtitles/`;
  const trasksURL = `http://${hostname}:8081/trasks/`;
  var sample_video = document.getElementById("sample_video");
  var video = document.getElementsByTagName("video")[0];
  const textTracks = _.get(video, "textTracks", null);

  const [folders, setFolders] = useState([]);
  const [filesOfParent, setFilesOfParent] = useState([]);
  const [subtitles, setSubtitles] = useState(null);
  const [fileName, setFileName] = useState("");
  const [nextFile, setNextFile] = useState("");
  const [previousFile, setPreviousFile] = useState("");
  // const [focus, setFocus] = useState(0);
  const [state, setState] = useState({
    url: null,
    pip: false,
    playing: true,
    controls: false,
    light: false,
    volume: 0.8,
    muted: false,
    played: 0,
    loaded: 0,
    duration: 0,
    playbackRate: 1.0,
    loop: false,
    isFullSreen: false,
    boxTracks: false,
    mouseMove: new Date().getTime(),
    hide: false
  });

  const changeSubtitle = (language) => {
    if (textTracks && textTracks.length > 0) {
      for (let i = 0; i < textTracks.length; i++) {
        textTracks[i].mode = textTracks[i].language === language ? "showing" : "hidden";
      }
    }
    const newSybtitle = _.clone(subtitles);
    newSybtitle.forEach((sub) => {
      sub.default = sub.language === language;
    });
    setSubtitles(newSybtitle);
  };
  const handleActionFile = (fileName, path) => {
    if (fileName) history.push(`/${[path, fileName].join("/")}?type=file`);
  };

  const borderText = (px, color) => {
    const list = [0];
    for (let i = 1; i <= px; i++) {
      list.push(...[i, -i]);
    }
    const css = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        css.push(`${list[i]}px ${list[j]}px ${color}`);
      }
    }
    return css.join(",");
  };

  const setStateElm = (value) => {
    const newStage = _.cloneDeep(state);
    _.assign(newStage, value);
    setState(newStage);
  };

  const handleFullSreen = (isFullSreen) => {
    if (isFullSreen) {
      screenfull.request(sample_video);
    } else {
      screenfull.exit();
    }
    setStateElm({ isFullSreen });
  };

  const handleSeekMouseDown = () => {
    setStateElm({ seeking: true, seekingLine: state.played });
  };

  const handleSeekChange = (e) => {
    setStateElm({ seekingLine: parseFloat(e.target.value) });
  };

  const handleSeekMouseUp = (e) => {
    setStateElm({ seeking: false, played: state.seekingLine });
    playerRef.current?.seekTo(parseFloat(state.seekingLine * state.duration), "seconds");
  };

  const handleAutoHide = () => {
    setStateElm({ hide: false });
    clearTimeout(currentRef.current);
    currentRef.current = setTimeout(() => {
      setStateElm({ hide: true });
    }, 3000);
  };

  useLayoutEffect(() => {
    if (type !== "file") {
      fetch(publicURL + fullPathRoot.join("/"))
        .then((response) => response.json())
        .then((data) => setFolders(data));
    } else {
      fetch(publicURL + backRootPath)
        .then((response) => response.json())
        .then((data) => setFilesOfParent(data.filter((d) => d.type === "file")));
      fetch(trasksURL + pathViewFile)
        .then((response) => response.json())
        .then((data) => setSubtitles(data));
    }
  }, [rootPath]);

  useEffect(() => {
    const index = _.findIndex(filesOfParent, (f) => f.name === fileNameUrl);
    setFileName((filesOfParent[index] || {}).name);
    setNextFile((filesOfParent[index + 1] || {}).name);
    setPreviousFile((filesOfParent[index - 1] || {}).name);
  }, [filesOfParent]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-body">
          <b>{root !== "" ? <Link to="/">Home</Link> : "Home"}</b>
          {fullPathRoot.map((path, index) => {
            const currentPathArr = _.dropRight(fullPathRoot, fullPathRoot.length - index - 1);
            return (
              <b key={index}>
                {" / "}
                {root !== "" && index + 1 !== fullPathRoot.length && <Link to={`/${currentPathArr.join("/")}`}>{path}</Link>}
                {root !== "" && index + 1 === fullPathRoot.length && path}
              </b>
            );
          })}

          <br />
          <br />
          <b>{root !== "" && <Link to={`/${backRootPath}`}>{"< Back"}</Link>}</b>
          <br />
          <br />
          <br />
          {type !== "file" ? (
            folders.map((folder, index) => {
              const fullPath = _.filter([root, pathName, folder.name], (elm) => !!elm).join("/");
              return (
                <div className={`App-item`} key={index}>
                  <img src={folder.type === "file" ? fileIcon : folderIcon} alt="icon" />
                  <Link to={`/${fullPath}${folder.type === "file" ? "?type=file" : ""}`}>{folder.name}</Link>
                </div>
              );
            })
          ) : (
            <>
              <div className="player-wrapper" id="sample_video">
                <div id="sample_video" className={`v-vlite ${state.playing ? "v-playing" : "v-paused"}`} onMouseMove={() => handleAutoHide()}>
                  {!!subtitles && (
                    <ReactPlayer
                      ref={playerRef}
                      className="react-player vlite-js"
                      style={{ "--shadow": borderText(4, "#000") }}
                      // controls
                      url={publicURL + pathViewFile}
                      pip={state.pip}
                      playing={state.playing}
                      light={state.light}
                      loop={state.loop}
                      playbackRate={state.playbackRate}
                      volume={state.volume}
                      muted={state.muted}
                      onDuration={(duration) => setStateElm({ duration: duration })}
                      onEnded={() => handleActionFile(nextFile, backRootPath)}
                      onProgress={(stage) => setStateElm({ played: stage.played })}
                      config={{
                        attributes: {
                          crossOrigin: "anonymous"
                        },
                        file: {
                          tracks: subtitles.map((sub, index) => ({
                            kind: "subtitles",
                            src: subtitlesURL + pathViewFile + `?language=${sub.language}`,
                            srcLang: sub.language,
                            default: true
                          }))
                        }
                      }}
                    />
                  )}

                  <div className={`v-topBar ${state.hide ? "hidden" : ""}`}>
                    <span className="v-topTitle">{fileName}</span>
                  </div>
                  <div
                    className="v-overlayVideo"
                    onClick={() => setStateElm({ playing: !state.playing })}
                    onDoubleClick={() => handleFullSreen(!state.isFullSreen)}
                  ></div>
                  <button className="v-bigPlay v-controlButton" aria-label="Play" onClick={() => setStateElm({ playing: !state.playing })}>
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0ZM7.5 12.67V7.33c0-.79.88-1.27 1.54-.84l4.15 2.67a1 1 0 0 1 0 1.68l-4.15 2.67c-.66.43-1.54-.05-1.54-.84Z"></path>
                    </svg>
                  </button>
                  <div className={`v-controlBar ${state.hide ? "hidden" : ""}`}>
                    <div className="v-progressBar">
                      <div className="v-progressSeek" style={{ width: `${(state.seeking ? state.seekingLine : state.played) * 100}%` }}></div>
                      <input
                        onMouseDown={handleSeekMouseDown}
                        onChange={handleSeekChange}
                        onMouseUp={handleSeekMouseUp}
                        type="range"
                        className="v-progressInput"
                        min={0}
                        max={0.999999}
                        step="any"
                        value="0"
                        orient="horizontal"
                      />
                    </div>
                    <div className="v-controlBarContent">
                      <div className="v-playPauseButton">
                        <span className="v-previousIcon v-iconNext" onClick={() => handleActionFile(previousFile, backRootPath)}>
                          <svg version="1.1" viewBox="0 0 32 32" style={{ width: "38px", height: "38px" }}>
                            <path className="ytp-svg-fill" d="m 12,12 h 2 v 12 h -2 z m 3.5,6 8.5,6 V 12 z" id="ytp-id-10"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="v-playPauseButton" onClick={() => setStateElm({ playing: !state.playing })}>
                        <span className="v-playerIcon v-iconPlay">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                            <path d="M6 4l20 12L6 28z"></path>
                          </svg>
                        </span>

                        <span className="v-playerIcon v-iconPause">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                            <path d="M4 4h10v24H4zm14 0h10v24H18z"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="v-playPauseButton" onClick={() => handleActionFile(nextFile, backRootPath)}>
                        <span className="v-nextIcon v-iconNext">
                          <svg version="1.1" viewBox="0 0 32 32" style={{ width: "38px", height: "38px" }}>
                            <path className="ytp-svg-fill" d="M 12,24 20.5,18 12,12 V 24 z M 22,12 v 12 h 2 V 12 h -2 z" id="ytp-id-12"></path>
                          </svg>
                        </span>
                      </div>
                      <div className="v-time">
                        <span className="v-currentTime">
                          <Duration seconds={state.duration * (state.seeking ? state.seekingLine : state.played)}></Duration>
                        </span>
                        &nbsp;/&nbsp;
                        <span className="v-duration">
                          <Duration seconds={state.duration}></Duration>
                        </span>
                      </div>
                      <div className={`v-subtitle ${state.boxTracks ? "v-active" : ""}`} onClick={() => setStateElm({ boxTracks: !state.boxTracks })}>
                        <span className="v-subIcon">
                          <svg viewBox="0 0 20 16" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 0H2C.9 0 0 .9 0 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2ZM2 8h4v2H2V8Zm10 6H2v-2h10v2Zm6 0h-4v-2h4v2Zm0-4H8V8h10v2Z"></path>
                          </svg>
                        </span>
                        <div className={`v-subtitlesList ${state.boxTracks ? "v-active" : ""}`}>
                          <ul>
                            <li onClick={() => changeSubtitle(null)}>
                              <button className={`v-trackButton ${!subtitles.find((s) => !!s.default) ? "v-active" : ""}`} data-language="off">
                                <svg viewBox="0 0 18 14" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M5.6 10.6 1.4 6.4 0 7.8l5.6 5.6 12-12L16.2 0z"></path>
                                </svg>
                                Off
                              </button>
                            </li>
                            {subtitles &&
                              subtitles.map((sub) => {
                                return (
                                  <li onClick={() => changeSubtitle(sub.language)}>
                                    <button className={`v-trackButton ${sub.default ? "v-active" : ""}`} data-language="off">
                                      <svg viewBox="0 0 18 14" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.6 10.6 1.4 6.4 0 7.8l5.6 5.6 12-12L16.2 0z"></path>
                                      </svg>
                                      {sub.language}
                                    </button>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      </div>
                      <div className={`v-volume ${state.muted ? "v-muted" : ""}`} onClick={() => setStateElm({ muted: !state.muted })}>
                        <span className="v-playerIcon v-iconVolumeHigh">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 32">
                            <path d="M27.814 28.814a1.5 1.5 0 0 1-1.061-2.56C29.492 23.515 31 19.874 31 16.001s-1.508-7.514-4.247-10.253a1.5 1.5 0 1 1 2.121-2.121C32.179 6.932 34 11.327 34 16.001s-1.82 9.069-5.126 12.374a1.495 1.495 0 0 1-1.061.439zm-5.329-2.829a1.5 1.5 0 0 1-1.061-2.56c4.094-4.094 4.094-10.755 0-14.849a1.5 1.5 0 1 1 2.121-2.121c2.55 2.55 3.954 5.94 3.954 9.546s-1.404 6.996-3.954 9.546a1.495 1.495 0 0 1-1.061.439zm-5.328-2.828a1.5 1.5 0 0 1-1.061-2.56 6.508 6.508 0 0 0 0-9.192 1.5 1.5 0 1 1 2.121-2.121c3.704 3.704 3.704 9.731 0 13.435a1.495 1.495 0 0 1-1.061.439zM13 30a1 1 0 0 1-.707-.293L4.586 22H1a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h3.586l7.707-7.707A1 1 0 0 1 14 3v26a1.002 1.002 0 0 1-1 1z"></path>
                          </svg>
                        </span>
                        <span className="v-playerIcon v-iconVolumeMute">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                            <path d="M13 30a1 1 0 0 1-.707-.293L4.586 22H1a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h3.586l7.707-7.707A1 1 0 0 1 14 3v26a1.002 1.002 0 0 1-1 1z"></path>
                          </svg>
                        </span>
                      </div>
                      <div className={`v-fullscreen ${state.isFullSreen ? "v-exit" : ""}`} onClick={() => handleFullSreen(!state.isFullSreen)}>
                        <span className="v-playerIcon v-iconFullscreen">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                            <path d="M27.414 24.586L22.828 20 20 22.828l4.586 4.586L20 32h12V20zM12 0H0v12l4.586-4.586 4.543 4.539 2.828-2.828-4.543-4.539zm0 22.828L9.172 20l-4.586 4.586L0 20v12h12l-4.586-4.586zM32 0H20l4.586 4.586-4.543 4.539 2.828 2.828 4.543-4.539L32 12z"></path>
                          </svg>
                        </span>
                        <span className="v-playerIcon v-iconShrink">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                            <path d="M24.586 27.414L29.172 32 32 29.172l-4.586-4.586L32 20H20v12zM0 12h12V0L7.414 4.586 2.875.043.047 2.871l4.539 4.543zm0 17.172L2.828 32l4.586-4.586L12 32V20H0l4.586 4.586zM20 12h12l-4.586-4.586 4.547-4.543L29.133.043l-4.547 4.543L20 0z"></path>
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="App-list">
                {filesOfParent.map((file, index) => {
                  const fullPath = _.filter([root, backPath, file.name], (elm) => !!elm).join("/");
                  return (
                    <div className={`App-item ${file.name === fileName ? "active" : ""}`} key={index}>
                      <img src={file.type === "file" ? fileIcon : folderIcon} alt="icon" />
                      <Link to={`/${fullPath}?type=file`}>{file.name}</Link>
                      {file.name === fileName && <img src={startingGif} alt="icon" />}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <br />
          <br />
          <b>{root !== "" && <Link to={`/${backRootPath}`}>{"< Back"}</Link>}</b>
        </div>
      </header>
    </div>
  );
};

export default Home;
