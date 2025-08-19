<template>
    <PSwitcher label="Отправить позже" v-model="checked" @update:modelValue="handleSwitcherChange"/>
    <div class="send-late" v-if="form?.send_late && form.send_late > 0 && checked">{{new Date(form.send_late * 1000).toLocaleString()}}</div>
    
        <div v-if="modalOpen" class="simple-modal-overlay">
        <div class="simple-modal">
            <div class="modal-content">
                <div class="custom-calendar">
                <div class="calendar-header">
                    <button class="nav-btn" @click="previousMonth">&lt;</button>
                    <span class="month-year">{{ currentMonthName }} {{ currentYear }}</span>
                    <button class="nav-btn" @click="nextMonth">&gt;</button>
                </div>
                
                <div class="days-header">
                    <div v-for="day in daysOfWeek" :key="day" class="day-header">{{ day }}</div>
                </div>
                
                <div class="calendar-grid">
                    <div 
                        v-for="day in calendarDays" 
                        :key="day.key"
                        :class="['calendar-day', { 
                            'other-month': !day.currentMonth,
                            'selected': day.selected,
                            'today': day.today
                        }]"
                        @click="selectDate(day)"
                    >
                        {{ day.day }}
                    </div>
                </div>
                
                <div class="time-selection">
                    <div class="selected-date">{{ selectedDateDisplay }}</div>
                    <div class="time-inputs">
                        <div class="time-input-group">
                            <label>Час:</label>
                            <input 
                                type="number" 
                                :value="selectedHour" 
                                @input="handleHourChange"
                                min="0" 
                                max="24" 
                                class="time-input"
                            />
                        </div>
                        <span class="time-separator">:</span>
                        <div class="time-input-group">
                            <label>Мин:</label>
                            <input 
                                type="number" 
                                :value="selectedMinute" 
                                @input="handleMinuteChange"
                                min="0" 
                                max="59" 
                                class="time-input"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <p-button style="margin-top: 20px" title="Отправить позже" @click="handleButtonClick"/>
            </div>
          <button type="button" class="close-btn" @click="handleCloseModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
              <rect x="1.36133" width="22.1161" height="1.92314" rx="0.961571" transform="rotate(45 1.36133 0)" fill="white"/>
              <rect x="16.998" y="1.35974" width="22.1161" height="1.92314" rx="0.961571" transform="rotate(135 16.998 1.35974)" fill="white"/>
            </svg>
          </button>
        </div>
    </div>
    
    <div class="agreement">
        <CheckBoxComp :modelValue="agreemntChecked" @update:modelValue="handleCheckboxChange"/>
        <div class="agreement-text" :class="{'agreement-checked': agreemntChecked, error: !valid}"
            @click="handleTextClick"
        >Подтверждаю, что получено согласие на обработку и передачу персональных данных клиента</div>
    </div> 
</template>

<script lang="ts">
import CheckBoxComp from '../../ui/CheckBox.vue';
import PSwitcher from '../../ui/PSwitcher.vue';
import { DocForm } from '../../../interfaces/interface';
import { defineComponent, PropType, ref, nextTick, computed } from 'vue'

import PButton from '../../ui/PButton.vue';

export default defineComponent({
    name: 'COptions',
    components: {
        PSwitcher, CheckBoxComp,
        PButton
    },
    props: {
        form: Object as PropType<DocForm>
    },
    setup(props, { emit }){
        const checked = ref<boolean>(false)
        const modalOpen = ref<boolean>(false)
        const valid = ref<boolean>(true)
        const agreemntChecked = ref<boolean>(props.form?.agreement === 'Y')
        const date = ref<Date>(new Date())
        
        // Calendar logic
        const currentDate = ref(new Date())
        const selectedDate = ref(new Date())
        const selectedHour = ref(12)
        const selectedMinute = ref(0)
        
        // Validation functions for time inputs
        const validateHour = (hour: number): number => {
            if (hour < 0) return 0
            if (hour > 24) return 24
            return hour
        }
        
        const validateMinute = (minute: number): number => {
            if (minute < 0) return 0
            if (minute > 59) return 59
            return minute
        }
        
        const daysOfWeek = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В']
        const monthNames = [
            'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
            'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
        ]
        
        const currentMonthName = computed(() => monthNames[currentDate.value.getMonth()])
        const currentYear = computed(() => currentDate.value.getFullYear())
        
        const selectedDateDisplay = computed(() => {
            const dayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
            const monthNamesShort = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК']
            const dayName = dayNames[selectedDate.value.getDay()]
            const monthName = monthNamesShort[selectedDate.value.getMonth()]
            const day = selectedDate.value.getDate()
            const year = selectedDate.value.getFullYear()
            return `${dayName} ${monthName}. ${day} ${year}`
        })
        
        const calendarDays = computed(() => {
            const year = currentDate.value.getFullYear()
            const month = currentDate.value.getMonth()
            const firstDay = new Date(year, month, 1)
            const lastDay = new Date(year, month + 1, 0)
            const startDate = new Date(firstDay)
            startDate.setDate(startDate.getDate() - firstDay.getDay())
            
            const days = []
            const today = new Date()
            
            for (let i = 0; i < 42; i++) {
                const currentDay = new Date(startDate)
                currentDay.setDate(startDate.getDate() + i)
                
                const isCurrentMonth = currentDay.getMonth() === month
                const isSelected = currentDay.toDateString() === selectedDate.value.toDateString()
                const isToday = currentDay.toDateString() === today.toDateString()
                
                days.push({
                    key: i,
                    day: currentDay.getDate(),
                    currentMonth: isCurrentMonth,
                    selected: isSelected,
                    today: isToday,
                    date: new Date(currentDay)
                })
            }
            
            return days
        })
        
        const previousMonth = () => {
            currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
        }
        
        const nextMonth = () => {
            currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
        }
        
        const selectDate = (day: any) => {
            if (day.currentMonth) {
                selectedDate.value = new Date(day.date)
                selectedDate.value.setHours(selectedHour.value, selectedMinute.value)
            }
        }
        
        const validateEvent = (res: boolean) => {
            valid.value = res;
        }
        
        const setSendLate = () => {
            modalOpen.value = false;

            const finalDate = new Date(selectedDate.value)
            finalDate.setHours(selectedHour.value, selectedMinute.value, 0, 0)
            
            const timestamp = +finalDate.getTime()/1000;
            emit('updateProp', {send_late: timestamp})
        }
        
        const handleSwitcherChange = (value: boolean) => {
            modalOpen.value = value;
            if(value === false) {
                emit('updateProp', {send_late: 0})
            }
        }
        
        const handleTextClick = () => {
            agreemntChecked.value = !agreemntChecked.value
            nextTick(() => {
                emit('update', agreemntChecked.value)
            })
        }
        
        const handleCheckboxChange = (value: boolean) => {
            agreemntChecked.value = value
            emit('update', value)
        }

        const handleButtonClick = () => {
            setSendLate();
        }

        const handleCloseModal = () => {
            modalOpen.value = false;
        };
        
        const handleHourChange = (event: Event) => {
            const target = event.target as HTMLInputElement
            const value = parseInt(target.value) || 0
            selectedHour.value = validateHour(value)
        }
        
        const handleMinuteChange = (event: Event) => {
            const target = event.target as HTMLInputElement
            const value = parseInt(target.value) || 0
            selectedMinute.value = validateMinute(value)
        }
        
        return {
            checked, 
            agreemntChecked, 
            date, 
            modalOpen, 
            valid, 
            validateEvent,
            setSendLate,
            handleSwitcherChange,
            handleTextClick,
            handleCheckboxChange,
            handleButtonClick,
            handleCloseModal,
            handleHourChange,
            handleMinuteChange,
            daysOfWeek,
            currentMonthName,
            currentYear,
            calendarDays,
            selectedDateDisplay,
            selectedHour,
            selectedMinute,
            previousMonth,
            nextMonth,
            selectDate
        }
    }
})
</script>

<style>
.agreement{
    align-items: center;
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}
.agreement-text{
    margin-left: 8px;
    max-width: calc(100% - 32px);
    font-size: 12px;
    color: var(--primary-dark);
    cursor: pointer;
}

.agreement-text.error{
    color: var(--accent-danger);
}

.agreement-text.error .agreement-hint {
    color: var(--accent-danger);
}

.agreement-text.agreement-checked{
    color: var(--primary-black);
}

.agreement-text.agreement-checked .agreement-hint {
    color: var(--primary-dark);
    opacity: 0.7;
}

.date-picker-wrapper {
    margin-bottom: 16px;
}

.date-input-group,
.time-input-group {
    margin-bottom: 16px;
}

.date-input-group label,
.time-input-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--primary-black);
}

.date-input,
.time-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--lines-color);
    border-radius: 4px;
    font-size: 14px;
    color: var(--primary-black);
}

.date-input:focus,
.time-input:focus {
    outline: none;
    border-color: var(--main-color);
}

.simple-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}





.simple-modal {
    background-color: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    position: relative;
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    overflow: visible;
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-left: 40px; /* Отступ для кнопки слева */
}

.modal-content {
    max-height: calc(80vh - 40px);
    overflow-y: auto;
}

.close-btn{
    position: absolute;
    top: 20px;
    left: 0;
    transform: translateX(-100%);
    padding: 8px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    background-color: #a7a7a7;
    border: none;
    cursor: pointer;
}

.custom-calendar {
    width: 100%;
    max-width: 350px;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 8px;
}

.nav-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.nav-btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
}

.month-year {
    font-weight: 600;
    font-size: 16px;
    color: var(--primary-black);
}

.days-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 8px;
}

.day-header {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-dark);
    padding: 8px 4px;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 16px;
}

.calendar-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.calendar-day:hover {
    background-color: rgba(0, 0, 0, 0.1);
}

.calendar-day.other-month {
    color: var(--lines-color);
}

.calendar-day.selected {
    background-color: var(--main-color);
    color: white;
    border-color: var(--main-color);
}

.calendar-day.today {
    border-color: var(--main-color);
    font-weight: 600;
}

.time-selection {
    margin-top: 16px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.selected-date {
    text-align: center;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--primary-black);
}

.time-inputs {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.time-input-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.time-input-group label {
    font-size: 12px;
    color: var(--primary-dark);
}

.time-input {
    width: 50px;
    padding: 8px;
    border: 1px solid var(--lines-color);
    border-radius: 4px;
    text-align: center;
    font-size: 14px;
}

.time-input:focus {
    outline: none;
    border-color: var(--main-color);
}

.time-separator {
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-black);
    margin-top: 20px;
}
</style>