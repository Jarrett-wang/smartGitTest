import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import {DatePicker} from 'antd';
const { RangePicker } = DatePicker;
import moment from 'moment'

const FilterLine = styled.div`
  display: flex;
  min-height: 40px;
  width: 92%;
  padding-top: 1px;
  min-width: 1100px;
`
const FilterItems = styled.div`
  max-width: 95%;
  user-select: none;
`
const FilterAll = styled.div`
  width: 60px;
  min-width: 60px;
  height: 26px;
  line-height: 26px;
  margin: 6px 5px 0 0;
  text-align: center;
  cursor: pointer;
  color: #595959;
  &.active {
    color: #FF9052;
    background-color: #FFF2EA;
  }
`
const ItemStyle = styled.div`
  // 必须relative
  position: relative;
  display: inline-block;
  height: 26px;
  padding: 0 14px 0 14px;
  color: #595959;
  font-size: 14px;    
  line-height: 26px;
  margin-right: 4px;
  margin-top: 3px;
  cursor: pointer;
  &.active {
    color: #FF9052;
    background-color: #FFF2EA;
  }
`
const Label = styled.span`
  margin: 0 8px 0 8px;
`

/**
 * @description 筛选组件
 * @params  filters 筛选项  type 类型（multi 多选， 默认为单选）
 * @note  default 为默认选中的项目
 */

const CustomerFilter =  (props) => {
  const {name, type} = props
  const [filterData, setFilterData] = useState(props.filters)
  const [allActive, setAllActive] = useState(true)
  const {handleChange} = props
  const [dateValue, setDateValue] = useState()
  // 初始化激活项
  const init = () => {
    let temp = JSON.parse(JSON.stringify(filterData))
    temp.forEach(item => {
      item.default ? item.active = true : ''
    })
    setFilterData(temp)
  }
  useEffect(init, [])

  // 日期限制
  const disabledDate = (current) => {
    return current < moment(new Date(1950,1,1)).startOf('year') || current > moment().endOf('day')
  }
  // 点击
  const changeActive = (id) => {
    let temp = JSON.parse(JSON.stringify(filterData))
    let line = temp.find(item => item.id === id)
    let allSelect
    if (line && line.active) {
      if (type === 'multi') {
        // 如果是多选，且当前状态已激活，则取消选中项目
        let itemIndex = temp.findIndex(item => item.id === id)
        delete temp[itemIndex].active
      }
    } else {
      if (type === 'multi') {
        line ? line.active = true : ''
      } else {
        temp.forEach(item => delete item.active)
        line ? line.active = true : ''
      }
    }

    // 移除日期选择器的值
    setDateValue('')
    allSelect = !temp.some(item => item.active)

    //产品需求，多选状态下，选中其他所有项时，自动点亮（全部），并移除其他选中状态
    if (!temp.some(item => !item['active'] && !item['type'])) {
      allSelect = true
    }
    if (id === 0) {
      allSelect = true
    }
    if (allSelect) {
      let result
      setAllActive(true)
      temp.forEach(item => delete item.active)
      setFilterData(temp)
      type === 'multi' ? result = [0] : result = 0
      handleChange({[name]: result})
      return
    }
    setAllActive(false)
    let result = type === 'multi' ? [] : null;

    let match = temp.filter(item => item.active)
    // 多选返回数组，单选返回字段
    if (match && match.length > 0) {
      if (type === 'multi') {
        result = match.map(item => item.id)
      } else {
        result = match[0].id
      }
    }
    setFilterData(temp)
    handleChange({[name]: result})
  }

  // handleCustomer
  const handleCustomer = function (value){
    setAllActive(false)
    let temp = JSON.parse(JSON.stringify(filterData));
    temp.forEach(item => delete item.active)
    setFilterData(temp)
    // 时间的处理
    if (name === 'dateType' && value) {
      setDateValue(value)
      handleChange({
        dateType: 7,
        startTime: moment(value[0]).format('YYYY-MM-DD'),
        endTime: moment(value[1]).format('YYYY-MM-DD')
      })
    } else if (name === 'dateType' && !value) {
      setAllActive(true)
      setDateValue(value)
      handleChange({dateType: 0})
    }
  }
  const Item = (params) => {
    // TODO: 这里判断区分不同的渲染，datePicker等
    if (params.type === 'datePicker') {
      return (
        <ItemStyle key={params.id}>
          <Label>{params.value}</Label>
          <RangePicker
            key={params.id} onChange={handleCustomer}
            value={dateValue}
            allowclear={true}
            disabledDate={disabledDate}
            style={{ width:"240px"}}
            getPopupContainer={
              triggerNode => {
                return triggerNode.parentNode || document.body;
              }
            }
          />
        </ItemStyle>
      )
    }
    return (
      <ItemStyle key={params.id} className={params.active ? 'active' : undefined} onClick={() => changeActive(params.id)}>{params.value}</ItemStyle>
    )
  }
  return (
    <FilterLine>
      <FilterAll
        onClick={() => changeActive(0)} className={allActive ? 'active' : undefined}
        style={type === 'multi' ? {margin: '4px 5px 0 0'} : {}}
      >
        全部
      </FilterAll>
      <FilterItems>
        {
          filterData.map(item => {
            return Item(item)
          })
        }
      </FilterItems>
    </FilterLine>
  )
}
export default CustomerFilter
//使用
{/* <CustomerFilter filters={createDate} name={"dateType"} handleChange={handleChange}/> */}
