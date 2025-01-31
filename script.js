document.addEventListener("DOMContentLoaded", () => {
    fetchCourses();
});

let coursesData = [];
let secondaryData = [];

async function fetchCourses() {
    try {
        const responsePrimary = await fetch("https://usis-cdn.eniamza.com/connect.json"); coursesData = await responsePrimary.json();
        const responseSecondary = await fetch("https://usis-cdn.eniamza.com/usisdump.json"); secondaryData = await responseSecondary.json();
        coursesData.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
        displayCourses(coursesData);
    } catch (error) {
        console.error("Error fetching courses:", error);
    }
}

function displayCourses(courses) {
    const tableBody = document.getElementById("courseTable");
    tableBody.innerHTML = "";
    courses.forEach(course => {
        const secondaryCourse = secondaryData.find(sec => sec.courseCode === course.courseCode);
        const secondaryFaculty = secondaryData.find(sec => sec.empShortName === course.faculties);
        const courseTitle = secondaryCourse ? secondaryCourse.courseTitle : '';
        const empName = secondaryFaculty ? secondaryFaculty.empName : '';

        const finalExam = formatExamDate(course.sectionSchedule.finalExamDate, course.sectionSchedule.finalExamStartTime, course.sectionSchedule.finalExamEndTime);
        const midExam = formatExamDate(course.sectionSchedule.midExamDate, course.sectionSchedule.midExamStartTime, course.sectionSchedule.midExamEndTime);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="course-code" data-detail="${course.courseCode} ${courseTitle ? '- ' + courseTitle : ''}">
                ${course.courseCode} <i class="fas fa-info-circle"></i>
            </td>
            <td class="faculty" data-detail="${course.faculties} ${empName ? '- ' + empName : ''}">
                ${course.faculties} <i class="fas fa-user"></i>
            </td>
            <td><i class="fas fa-chair"></i> ${course.capacity - course.consumedSeat}/${course.capacity}</td>
            <td>
                ${formatSchedule(course.sectionSchedule.classSchedules, 'schedule')}
            </td>
            <td>
                ${formatSchedule(course.labSchedules, 'lab-schedule')}
            </td>
            <td class="exam-day" data-full="Mid Exam: ${midExam}\nFinal Exam: ${finalExam}">
                <span class="exam-tooltip" data-tooltip="Midterm Exam: ${midExam}">${midExam.split(",")[0]}</span>
                <span class="exam-tooltip" data-tooltip="Final Exam: ${finalExam}">${finalExam.split(",")[0]}</span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function formatSchedule(schedule, className) {
    if (!schedule || !schedule.length) return "";
    return schedule.map(({ day, startTime, endTime }) => {
        return `<span class="${className}" data-full="${day} (${formatTime(startTime)} - ${formatTime(endTime)})">${day.substring(0, 3)}</span>`;
    }).join(" ");
}

function formatExamDate(dateStr, startTime, endTime) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return `${formatDate(date)}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
}

function formatDate(date) {
    const options = { month: "long", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options).replace(/(\d+)(?=(st|nd|rd|th))/, "$1");
}

function formatTime(time) {
    if (!time) return "";
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function filterCourses() {
    const searchQuery = document.getElementById("search").value.toLowerCase();
    const filteredCourses = coursesData.filter(course =>
        course.courseCode.toLowerCase().includes(searchQuery) ||
        course.faculties.toLowerCase().includes(searchQuery)
    );
    
    displayCourses(filteredCourses);
}

function toggleAboutPanel() {
    const aboutPanel = document.querySelector('.about-panel');
    if (!aboutPanel.classList.contains('expanded')) {
        aboutPanel.innerHTML = `
            Credits - About this website
            <br><br>
            Made by <a href="https://dewanmukto.com/home" target="_blank">Dewan Mukto</a><br>
            SLMS data from <a href="https://usis.eniamza.com/" target="_blank">USIS Unlocked</a> by <a href="https://eniamza.com/" target="_blank">Tashfeen Azmaine</a>
             <br><br>
             Tap/click again to close
        `;
        aboutPanel.classList.add('expanded');
    } else {
        aboutPanel.innerHTML = 'Credits';
        aboutPanel.classList.remove('expanded');
    }
}
