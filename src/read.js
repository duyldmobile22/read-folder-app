/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import fileIcon from "./file.png";
import folderIcon from "./folder.png";
import "./App.css";
import ReactPlayer from "react-player";
import _ from "lodash";
import Duration from "./Duration";
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
  let pathViewFile = fullPathRoot.join("/");

  const queryParams = new URLSearchParams(window.location.search);
  const type = queryParams.get("type");
  const readURL = `http://${hostname}:8081/`;
  const publicURL = `http://${hostname}:8081/public/`;
  const subtitlesURL = `http://${hostname}:8081/subtitles/`;
  const trasksURL = `http://${hostname}:8081/trasks/`;
  const sample_video = document.getElementById("sample_video");
  const video = document.getElementsByTagName("video")[0];
  const textTracks = _.get(video, "textTracks", null);
  const stateInit = {
    pip: false,
    playing: true,
    controls: false,
    light: false,
    volume: 1,
    muted: false,
    played: 0,
    loaded: 0,
    duration: 0,
    playbackRate: 1.0,
    loop: false
  };

  const [folders, setFolders] = useState([]);
  const [filesOfParent, setFilesOfParent] = useState([]);
  const [subtitles, setSubtitles] = useState(null);
  const [fileName, setFileName] = useState("");
  const [nextFile, setNextFile] = useState("");
  const [previousFile, setPreviousFile] = useState("");
  const [hide, setHide] = useState(false);
  const [boxTracks, setBoxTracks] = useState(false);
  const [state, setState] = useState(stateInit);
  const [isFullSreen, setIsFullSreen] = useState(false);
  const [indexFile, setIndexFile] = useState(0);
  const [indexSub, setIndexSub] = useState(0);
  const [isMouse, setIsMouse] = useState(false);


  const [file, setFile] = useState([]);

  if (!_.isEmpty(textTracks) && !_.isEmpty(subtitles)) {
    const subtitle = subtitles.find((s) => s.default);
    for (const element of textTracks) {
      element.mode = element.language === subtitle?.language ? "showing" : "hidden";
    }
  }

  const onBackButtonEvent = (e) => {
    window.history.pushState(null, null, window.location.pathname);
    history.replace(`/${backRootPath}`);
  };

  useEffect(() => {
    if (type === "file") onFullSreenEvent();
  }, []);

  useLayoutEffect(() => {
    fetch(readURL + fullPathRoot.join("/"))
      .then((response) => response.json())
      .then((data) => setFile(data));
    // setSubtitles(null);
    // setStateElm({ played: 0, playing: true });
    // setBoxTracks(false);
    // if (!isFullSreen) setIndexFile(0);
    // if (type !== "file") {
    //   fetch(publicURL + fullPathRoot.join("/"))
    //     .then((response) => response.json())
    //     .then((data) => setFolders(data));
    // } else {
    //   getSubtitles(0);
    //   fetch(publicURL + backRootPath)
    //     .then((response) => response.json())
    //     .then((data) => setFilesOfParent(data.filter((d) => d.type === "file")));
    // }
    // window.addEventListener("fullscreenchange", onFullSreenEvent);
    // if (type !== "file") {
    //   window.history.pushState(null, null, window.location.pathname);
    //   window.addEventListener("popstate", onBackButtonEvent);
    // }
    // return () => {
    //   window.removeEventListener("popstate", onBackButtonEvent);
    //   window.removeEventListener("fullscreenchange", onFullSreenEvent);
    // };
  }, [rootPath]);

  useEffect(() => {
    const index = _.findIndex(filesOfParent, (f) => f.name === fileNameUrl);
    setFileName((filesOfParent[index] || {}).name);
    setNextFile((filesOfParent[index + 1] || {}).name);
    setPreviousFile((filesOfParent[index - 1] || {}).name);
  }, [filesOfParent]);

  useEffect(() => {
    if (!_.isEmpty(folders)) {
      document.getElementById("file_0")?.classList?.add("f-active");
    }
  }, [folders]);

  useEffect(() => {
    const files = document.getElementsByClassName("f-active");
    if (files && !_.isEmpty(files)) {
      for (const element of files) {
        element.classList.remove("f-active");
      }
    }
    const nextFile = document.getElementById(`file_${indexFile}`);
    if (nextFile) {
      nextFile.classList.add("f-active");
      nextFile.scrollIntoView();
    }
    const playFile = document.getElementById(`play_${indexFile}`);
    if (playFile) {
      playFile.classList.add("f-active");
    }
  }, [indexFile]);

  useEffect(() => {
    const files = document.getElementsByClassName("s-active");
    if (files && !_.isEmpty(files)) {
      for (const element of files) {
        element.classList.remove("s-active");
      }
    }
    const subFile = document.getElementById(`sub_${indexSub}`);
    if (subFile) {
      subFile.classList.add("s-active");
    }
  }, [indexSub]);

  const changeSubtitle = (language, noSetSub) => {
    if (textTracks && textTracks.length > 0) {
      for (const element of textTracks) {
        element.mode = element.language === language ? "showing" : "hidden";
      }
    }
    const newSybtitle = _.clone(subtitles);
    newSybtitle.forEach((sub) => {
      sub.default = sub.language === language;
    });
    if (!noSetSub) setSubtitles(newSybtitle);
  };

  const handleActionFile = (fileName, path) => {
    if (fileName) history.push(`/${[path, fileName].join("/")}?type=file`);
  };

  const sizeBar = {
    "--width-bar": sample_video && sample_video.offsetHeight >= 1080 ? "100px" : "50px",
    "--font-size": sample_video && sample_video.offsetHeight >= 1080 ? "24px" : "12px",
    "--font-size-subtitle": sample_video ? sample_video.offsetHeight / 18 + "px" : "24px"
  };

  useEffect(() => {
    if (sample_video && type === "file") {
      handleFullSreen(true);
    }
  }, [sample_video]);

  const onFullSreenEvent = (e) => {
    if (!document.fullscreenElement) {
      history.push(`/${backRootPath}`);
      setIsFullSreen(false);
    } else {
      setIsFullSreen(true);
    }
  };

  const setStateElm = (value) => {
    const newStage = _.cloneDeep(state);
    _.assign(newStage, value);
    setState(newStage);
  };

  const handleFullSreen = (isFullSreen) => {
    if (isFullSreen) {
      sample_video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
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

  const handleChangeSeek = (isNext, seconds) => {
    let newSeconds = parseFloat(state.played * state.duration) + (isNext ? seconds || 15 : -(seconds || 15));
    newSeconds = newSeconds > 0 ? newSeconds : 0;
    setStateElm({ played: newSeconds / state.duration });
    playerRef.current?.seekTo(newSeconds, "seconds");
  };

  const handleAutoHide = (event) => {
    setHide(false);
    clearTimeout(currentRef.current);

    currentRef.current = setTimeout((indexFile) => {
      setHide(true);
      setBoxTracks(false);
      if (indexFile !== 0) setIndexFile(0);
    }, 5000);
  };

  const getSubtitles = (index) => {
    if (index >= 10) return
    fetch(trasksURL + pathViewFile)
      .then((response) => response.json())
      .then((data) => {
        if (_.isArray(data)) {
          setSubtitles(data);
        } else {
          setTimeout(() => {
            getSubtitles(index + 1);
          }, 2000);
        }
      });
  };

  const actionInListFileHandle = (action) => {
    let newIndex = action ? indexFile + 1 : indexFile - 1;
    if (newIndex < 0) newIndex = folders.length - 1;
    if (newIndex >= folders.length) newIndex = 0;
    setIndexFile(newIndex);
  };

  const upDownVideoHandle = (action) => {
    if (!boxTracks) {
      let newIndex = action ? 3 : 0;
      if (indexFile === 0 && !action) {
        setHide(true);
        if (indexFile === 3 && action) setIndexFile(0);
      } else {
        setIndexFile(newIndex);
      }
    } else {
      let newIndex = action ? indexSub + 1 : indexSub - 1;
      if (newIndex < 0) newIndex = subtitles.length;
      if (newIndex > subtitles.length) newIndex = 0;
      setIndexSub(newIndex);
    }
  };

  const leftRightVideoHandle = (action) => {
    if (indexFile === 0) {
      handleChangeSeek(action);
    } else {
      let newIndex = action ? indexFile + 1 : indexFile - 1;
      if (newIndex < 1) newIndex = 8;
      if (newIndex > 8) newIndex = 1;
      setIndexFile(newIndex);
    }
  };

  const boxTrackHandle = () => {
    if (!_.isEmpty(subtitles) && !boxTracks) {
      const index = _.findIndex(subtitles, (s) => !!s.default);
      setIndexSub(index + 1);
    }
    !_.isEmpty(subtitles) && setBoxTracks(!boxTracks);
  };

  return (
    <>
      <div>
        <header className="App-header">
          <div id="body" style={{ width: "100%" }}>
            {file?.map(f => <div>{f}<br /></div> )}
          </div>
        </header>
      </div>
    </>
  );
};

export default Home;
