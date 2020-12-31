import React, { useState, useEffect } from 'react';
import './tianDiCallContent.scss'
import minimize from "../../assets/icons/minimize.png";
import unreadyImg from "../../assets/icons/unready.png";
import hangUpImg from "../../assets/icons/hangUp.png";
import tdCallImg from "../../assets/icons/call.png";
import tdKeepImg from "../../assets/icons/tdKeep.png";
import tdKeepingImg from "../../assets/icons/tdKeeping.png";
import tdTransferImg from "../../assets/icons/tdTransfer.png";
import tdTransletingImg from "../../assets/icons/tdTransleting.png";
import { useInterval } from "../../hooks/useInterval";
import { useUpdateEffect } from "../../hooks/useUpdateEffect"
import { tdCallState } from '../../constants/CONTANCES';
import { bmsAppTypeToAppType, setTimes } from "../../utils"
import PhoneBar from "./PhoneBar"
let tdPageId = Math.floor((Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, 8));
let phoneBar = null
let isMain = false;
const username = "1008"
const password = 'tiandi1234';
const domain = 'tiandi.xswitch.cn';
const socketUrl = 'wss://tiandi.xswitch.cn/wss';
const extn = '1008';
const queue = '售后技能组';
const TianDiCallContent = (props) => {
  const { onClose, phone, callback, hangUpValue, reset } = props
  const [callTime, setCallTime] = useState(0)//拨打电话时间
  const [restTime, setRestTime] = useState(0)//空闲时间
  const [readyTime, setReadyTime] = useState(0)//忙碌时间
  const [busyTime, setBusyTime] = useState(0)//休息时间
  const [currentCallState, setCallState] = useState({state:""});//当前拨打的状态
  const [keepStatus, setKeepStatus] = useState(false)//保持的状态
  const [transferStatus, setTransferStatus] = useState(false)//转接的状态
  const [restTimeRunning, setRestTimeRunning] = useState(true);//控制休息的开关
  const [busyTimeRunning, setBusyTimeRunning] = useState(false);//控制忙碌的开关
  const [readyTimeRunning, setReadyTimeRunning] = useState(false);//控制置闲的开关
  const [callTimeRunning, setCallTimeRunning] = useState(false);//控制拨号的开关
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aliveCheckRunning, setAliveCheckRunning] = useState(false);
  const uid = "1001318";
  const appType = bmsAppTypeToAppType("ikcrm");
  // 获取用户坐席信息
  async function getSeatInfo() {
    return new Promise((resolve, reject) => {
      fetch(`${SIP_CONFIG.tddomain}/external/getUserBindInfo?userId=${uid}&appType=${appType}`, {
        method: 'GET',
      }).then(res => res.json())
        .catch(error => console.error('Error:', error))
        .then(response => {
          if (response.error_code === 0) {
            resolve(response.data)
          } else {
            reject(response.message)
          }
        });
    })
  }
  const onRinging = (value) => {
    console.log("来电弹屏", value);
  }
  function stateChange(val) {

  }
  // 推送事件触发结果
  function pushEvents(value) {
    setCallState(value.sipState)
    stateChange(value.sipState)
    localStorage.setItem('tdCallState', value.sipState.state);
    if (value.sipState.state === "ccDial_succ" || value.sipState.state === "ccDial_fail") {
      callback(2, "发起呼叫成功")
    }
    console.log(value.sipState.state);
  }
  function onMessage(info) {
    console.log(info);
  }
  //转接图片切换
  const imgTransferSrc = () => {
    if (transferStatus) {
      return tdTransletingImg
    }
    return tdTransferImg
  }
  //保持图片切换
  const imgKeepSrc = () => {
    if (keepStatus) {
      return tdKeepingImg
    }
    if (currentCallState.state === "ringing") {
      return tdCallImg
    }
    return tdKeepImg
  }
  // 图片
  const imgSrc = function () {
    if ((currentCallState.state === "ccLogin_succ" || currentCallState.state === "ccGoBreak_succ" || currentCallState.state === "ccGoReady_succ" || currentCallState.state === "ccGoRest_succ") && !phoneNumber) {
      return unreadyImg
    }
    if ((currentCallState.state === "ccLogin_succ" || currentCallState.state === "ccGoBreak_succ" || currentCallState.state === "ccGoReady_succ") && phoneNumber && phoneNumber.length > 0) {
      return tdCallImg
    }
    if (currentCallState.state === 'inCall' || currentCallState.state === 'ccUnHold_succ' || currentCallState.state === 'ccHold_succ' || currentCallState.state === 'ccDial_succ' || currentCallState.state === 'ringing') {
      return hangUpImg
    }
    if (currentCallState.state === 'ccHangup_succ') {
      return endImg
    }
  };
  //初始化状态
  const initState = () => {
    const callCode = localStorage.getItem('callState');
    if (!callCode) {
      setCallState({ state: "ccLogin_succ" });
    } else {
      const getCallData = () => {
        return callState.find(item => item.code === Number(callCode));
      };
      setCallState({ state: getCallData() });
    }
  }
  // 主页面存在性检查
  function checkMainAlive() {
    let currentTime = new Date().getTime();
    let heartBeatTime = localStorage.getItem('tdAliveCheck');
    return !Boolean(Math.abs(currentTime - heartBeatTime) > 2700);
  }
  // 主流程
  async function main() {
    let userInfo = await getSeatInfo()
    let isMainAlive = checkMainAlive();
    console.log('主页面存活' + isMainAlive);
    if (isMainAlive === false) {
      localStorage.setItem('tdcandidate', tdPageId.toString());
      setTimeout(function () {
        let candidate = localStorage.getItem('tdcandidate');
        if (candidate === tdPageId.toString()) {
          isMain = true;
          setAliveCheckRunning(true);
          register(userInfo)
        } else {
          isMain = false
        }
      }, 800);
    } else {
      let candidate = localStorage.getItem('tdcandidate');
      if (candidate !== tdPageId.toString()) {
        setAliveCheckRunning(false);
        initState()
      } else {
        register(userInfo) // 主页面的重新注册
      }
    }
  }
  //注册
  const register = (info) => {
    // const queue = '售后技能组';
    // const { account, password, socketUrl, domain } = info
    phoneBar = new PhoneBar({
      username: username,
      password: password,
      socketUrl: socketUrl,
      domain: domain,
      extn: extn, // 分机号
      queue: queue, // 队列名称
      onRinging: onRinging, // 弹屏回调
      onMessage: onMessage, // 信息返回，选填，不做任何处理，但要定义
      pushEvent: pushEvents // 推送事件触发结果
    });
  }
  const handleClose = () => {
    setKeepStatus(false)
    setTransferStatus(false)
    setPhoneNumber('')
    onClose()
  }
  // 输入框处理
  const changeValue = function (e) {
    if (e.target.value.length <= 11) {
      let value = e.target.value.replace(/[^\d]/g, '');
      setPhoneNumber(value);
    }
  };
  //保持
  const clickKeepHandle = () => {
    let params = { state: !keepStatus, date: new Date() }
    localStorage.setItem('keepStatus', JSON.stringify(params));
    setKeepStatus(keepStatus ? false : true)
    if (isMain) {
      keepStatus ? phoneBar.unhold() : phoneBar.hold()
    }
  }
  //转接
  const clickTransferHandle = () => {
    let params = { state: true, callee: phoneNumber, date: new Date() }
    localStorage.setItem('transferState', JSON.stringify(params));
    pushEvents({sipState:{state:"ccTransfer_succ"}})
    setTransferStatus(true)
    transferStatus ? phoneBar.transfer(phoneNumber) : null
    if (currentCallState.state === "ccTransfer_succ") {
      //后续这里替代下面的，目前转接没有状态返回
      setPhoneNumber('');
      setTransferStatus(false)
      setCallState({
        state: 'ccLogin_succ',
        code: 1,
        message: '初始状态...'
      });
      reset()
    }
    //这里等sdk返回，删除
    setPhoneNumber('');
    setTransferStatus(false)
    setCallState({
      state: 'ccLogin_succ',
      code: 1,
      message: '初始状态...'
    });
    reset()
  }
  //挂断
  const hangUp = function (value) {
    localStorage.setItem('tdHangUp', value.toString());
    if (isMain) {
      phoneBar.hangup()
    }
  };
  //拨打、挂断
  const clickHandle = () => {
    //根据状态判断执行拨打、挂断、转接等操作,目前写的是呼出的逻辑
    if (currentCallState.state === "" && !phoneNumber) {
      return null
    }
    if ((currentCallState.state === "ccLogin_succ" || currentCallState.state === "ccGoReady_succ" || currentCallState.state === "ccGoBreak_succ") && phoneNumber && phoneNumber.length > 0) {
      let params = {
        callee: phoneNumber,
        date: new Date()
      }
      setCallTimeRunning(false);
      setCallTime(0)
      pushEvents({ sipState: { state: "ccDial_succ" } })
      localStorage.setItem('tdcall', JSON.stringify(params));
      setCallTimeRunning(true);
      setRestTimeRunning(false)
      setBusyTimeRunning(false)
      setReadyTimeRunning(false)
      if (isMain) {
        console.log("执行主页面的拨打", phoneBar);
        phoneBar.doCall(phoneNumber)

      }
    }
    if (currentCallState.state === "ccDial_succ" || currentCallState.state === "calling" || currentCallState.state === "ringing") {
      hangUp((new Date()).valueOf())
      setTimeout(function () {
        setPhoneNumber('');
        setCallState({
          state: 'ccLogin_succ',
          code: 1,
          message: '尚未准备好...'
        });
        reset()
      }, 2000)
      //这里要根据下拉框的状态判断来控制具体哪个为true
      setRestTimeRunning(true)
      setBusyTimeRunning(true)
      setReadyTimeRunning(true)
    }
  }
  //下拉选择框变化
  const handleChange = (e) => {
    if (e.target.value === "rest") {
      //这里sdk状态推送错误，它推的是忙碌的状态，先改为忙碌的逻辑
      // setRestTime(0)
      // setRestTimeRunning(true)
      setBusyTime(0)
      setBusyTimeRunning(true)

    }
    if (e.target.value === "ready") {
      setReadyTime(0)
      setReadyTimeRunning(true)
    }
    if (e.target.value === "busy") {
      setBusyTime(0)
      setBusyTimeRunning(true)
    }
    localStorage.setItem('selectState', e.target.value)
    if (isMain) {
      phoneBar.onAgentStateSelected(e.target.value, queue, extn)
    }
  }
  // 记录休息时间的定时器
  useInterval(() => {
    setRestTime(restTime + 1)
  }, restTimeRunning ? 1000 : null);
  // 记录忙碌时间的定时器
  useInterval(() => {
    setBusyTime(busyTime + 1)
  }, busyTimeRunning ? 1000 : null);
  // 记录空闲时间的定时器
  useInterval(() => {
    setReadyTime(readyTime + 1)
  }, readyTimeRunning ? 1000 : null);
  // 记录呼叫时间的定时器
  useInterval(() => {
    setCallTime(callTime + 1)
  }, callTimeRunning ? 1000 : null);
  // const waitToCall = function () {
  //   setTime(0);
  //   setWaitRunning(true);
  // };
  //传入手机号码
  // useInterval(() => {
  //   const { phone } = props;
  //   function checkStateToCall() {
  //     setTime(time + 1);
  //     console.log(time);
  //     console.log("%c =================", "color: green;font-size: 18px");
  //     console.log('当前的sip状态' + currentCallState.state);
  //     console.log('当前传入的phone' + phone)
  //     console.log("%c =================", "color: green;font-size: 18px");
  //     if (currentCallState.state === 'ccLogin_succ') {
  //       setWaitRunning(false);
  //       setTime(0);
  //       setPhoneNumber(phone);
  //       let params = {
  //         callee: phone,
  //         date: new Date()
  //       };
  //       localStorage.setItem('sipCall', JSON.stringify(params));
  //       // 主页面由当前发起呼叫
  //       console.log('当前是否是主页面' + isMain);
  //       setTimeout(() => {
  //         if (isMain) {
  //           phoneBar.doCall(phone)
  //           setWaitRunning(true)
  //         } else {
  //           pushEvents({ status: "CallOut", called_number: phoneNumber })
  //         }
  //       }, 800)
  //     } else if(currentCallState.state === 'ccDial_succ') {
  //       // setTime(0)
  //       setWaitRunning(true)
  //       // console.log('未准备好')
  //     }
  //     // if (time > 5) {
  //     //   setWaitRunning(false)
  //     // }
  //   }
  //   if (phone && phone.length) {
  //     checkStateToCall()
  //   }
  // }, waitRunning ? 1000 : null);
  // //传入手机号码
  // useEffect(() => {
  //   if (phone && phone.length > 0) {
  //     setWaitRunning(false)
  //     waitToCall()
  //   }
  // }, [phone]);
  //初始化注册
  useEffect(() => {
    setCallState({
      state: 'ccLogin_succ',
      code: 1,
    });
    main()
    // 离开时清除定时器
    return () => {
      setAliveCheckRunning(false);
    }
  }, [])
  //拨打后状态恢复
  useEffect(()=>{
    if(currentCallState.state==="ccLogin_succ"){
      let selectState = localStorage.getItem('selectState');
      document.getElementById('tdSelect').value = selectState
    }
  },[currentCallState])
  // 主页面心跳
  useInterval(() => {
    localStorage.setItem('tdAliveCheck', new Date().getTime().toString())
  }, aliveCheckRunning ? 2000 : null);
  // 监听storage事件
  useEffect(() => {
    const handleStorage = function (e) {
      if (e.key === 'tdcall') {
        let value = JSON.parse(e.newValue);
        setPhoneNumber(value.callee);
        setCallTimeRunning(true);
        pushEvents({ sipState: { state: "ccDial_succ" } })
        if (isMain) {
          phoneBar.doCall(value.callee)
        }
      }
      if (e.key === 'selectState') {
        let selectState = localStorage.getItem("selectState")
        if (isMain) {
          phoneBar.onAgentStateSelected(selectState, queue, extn)

        }
      }
      if (e.key === 'keepStatus') {
        let keepState = JSON.parse(localStorage.getItem("keepStatus"))
        setKeepStatus(keepState.state)
        if (isMain) {
          keepState.state ? phoneBar.hold() : phoneBar.unhold()
        }
      }
      if (e.key === 'transferState') {
        let transferState = JSON.parse(localStorage.getItem("transferState"))
        setPhoneNumber(transferState.callee);
        setTransferStatus(false)
        if (isMain) {
          transferState.state ? phoneBar.transfer(phoneNumber) : phoneBar.transfer(phoneNumber)
        }
        setPhoneNumber('');
        setCallState({
          state: 'ccLogin_succ',
          code: 1,
          message: '登录成功...'
        });

      }
      if (e.key === 'tdHangUp') {
        if (isMain) {
          phoneBar.hangup()
        }
        setTimeout(function () {
          setPhoneNumber('');
          setCallState({
            state: 'ccLogin_succ',
            code: 1,
            message: '登录成功...'
          });
          reset()
        }, 2000)
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, []);
  useUpdateEffect(() => {
    if (hangUpValue > 0) {
      hangUp(hangUpValue)
    }
  }, [hangUpValue]);
  return (
    <div>
      <div className={'h5-sip-phone-tianDiCallContent'}>
        <div className={'h5-sip-phone-tianDiState'}>
          <div className={'h5-sip-phone-select'}>
            {currentCallState.state === 'ccLogin_succ' && <span className={'h5-sip-phone-time'}>{setTimes(restTime)}</span>}
            {currentCallState.state === "ccGoReady_succ" && <span className={'h5-sip-phone-time'}>{setTimes(readyTime)}</span>}
            {currentCallState.state === "ccGoBreak_succ" && <span className={'h5-sip-phone-time'}>{setTimes(busyTime)}</span>}
            {(currentCallState.state === 'ccLogin_succ' || currentCallState.state === "ccGoBreak_succ" || currentCallState.state === "ccGoReady_succ") && <select id="tdSelect" style={{ color: "#52C41A", fontSize: "12px", width: "110px" }} onChange={handleChange}>
              <option value="rest" style={{ color: "#52C41A" }}>空闲</option>
              <option value="ready" style={{ color: "#F56C6C" }}>休息</option>
              <option value="busy" style={{ color: "#FE9E16" }}>忙碌</option>
            </select>}
            {/* 暂时没有响铃状态和通话状态推送先用发起呼叫的状态代替 */}
            {(currentCallState.state === 'inCall' || currentCallState.state === "ccUnHold_succ" || currentCallState.state === "ccDial_succ" || currentCallState.state === 'ccHold_succ') && `通话中 ${setTimes(callTime)}`}
            {/* {currentCallState.state !== 'ccLogin_succ' && "您有新的来电..."} */}
          </div>
          <div className={'tiandi-input'}>
            <input placeholder={"请输入要拨打的电话"} value={phoneNumber} onChange={changeValue} />
          </div>
        </div>
        <img src={imgSrc()} alt="" onClick={clickHandle} className={'call-state'} onDragStart={(e) => { e.preventDefault() }} />
        {(currentCallState.state === "ccDial_succ" || currentCallState.state === "ccHold_succ" || currentCallState.state === "ccUnHold_succ" || currentCallState.state === "ringing") && <img src={imgKeepSrc()} alt="" onClick={clickKeepHandle} className={'call-state'} onDragStart={(e) => { e.preventDefault() }} />}
        {((currentCallState.state === "ccDial_succ" || currentCallState.state === "ccHold_succ" || currentCallState.state === "ccUnHold_succ") && currentCallState.state !== "ringing") && <img src={imgTransferSrc()} alt="" onClick={clickTransferHandle} className={'call-state'} onDragStart={(e) => { e.preventDefault() }} />}
        <img src={minimize} alt="" className={'minimize'} onClick={handleClose} onDragStart={(e) => { e.preventDefault() }} />
      </div>
      <audio id={"remoteVideo"} style={{ width: '205px', height: 30 }} />
    </div>
  )
}
export default TianDiCallContent;