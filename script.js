document.addEventListener("DOMContentLoaded", () => {
    fetchCourses();
});

let coursesData = [];
let secondaryData = [];
let cart = [];

async function fetchCourses() {
    try {
        const responsePrimary = await fetch("https://usis-cdn.eniamza.com/connect.json"); coursesData = await responsePrimary.json();
        const responseSecondary = await fetch("https://usis-cdn.eniamza.com/usisdump.json"); secondaryData = await responseSecondary.json();
        coursesData.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
        displayCourses(coursesData);
    } catch (error) {
        console.error("Error fetching courses:", error);
    } finally {
        loadingMessage.style.display = "none";
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

        const remainingSeats = course.capacity - course.consumedSeat;
        let seatsClass = '';
        let buttonDisabled = '';
        if (remainingSeats === course.capacity) {
            seatsClass = 'seats-white'; // All seats available (40/40)
        } else if (remainingSeats > course.capacity * 0.75) {
            seatsClass = 'seats-green'; // More than 75% seats available (green)
        } else if (remainingSeats > course.capacity * 0.5) {
            seatsClass = 'seats-yellow'; // More than 50% but less than 75% (yellow)
        } else if (remainingSeats > 0) {
            seatsClass = 'seats-red'; // Less than 50% seats available (red)
        } else {
            seatsClass = 'seats-black'; // No seats available (0/40)
            buttonDisabled = 'disabled'; // Disable the button if no seats are available
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="course-code" data-detail="${course.courseCode} ${courseTitle ? '- ' + courseTitle : ''}">
                ${course.courseCode} <i class="fas fa-info-circle"></i>
            </td>
            <td class="section">${course.sectionName || "N/A"}</td>
            <td class="faculty" data-detail="${course.faculties} ${empName ? '- ' + empName : ''}">
                ${course.faculties} <i class="fas fa-user"></i>
            </td>
            <td class="${seatsClass}">
                <i class="fas fa-chair"></i> ${remainingSeats}/${course.capacity}
            </td>
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
            <td>
                <button class="add-to-cart" data-course="${course.courseCode}" data-section="${course.sectionName || 'N/A'}" ${buttonDisabled}>➕</button>
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
            Made by <a href="https://dewanmukto.com/home" target="_blank">Dewan Mukto</a> 👑<br>
            SLMS data from <a href="https://usis.eniamza.com/" target="_blank">USIS Unlocked</a> by <a href="https://eniamza.com/" target="_blank">Tashfeen Azmaine</a>
            <br>
            Routine table from <a href="https://preprereg.vercel.app/" target="_blank">PrePreReg</a> by <a href="https://eniac00.github.io/terminal-portfolio/" target="_blank">Abir Ahammed Bhuiyan</a>
             <br><br>
             Tap/click again to close
        `;
        aboutPanel.classList.add('expanded');
    } else {
        aboutPanel.innerHTML = 'Credits';
        aboutPanel.classList.remove('expanded');
    }
}

document.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-to-cart")) {
        const courseCode = event.target.dataset.course;
        addToCart(courseCode);
    } else if (event.target.classList.contains("cart-remove")) {
        const courseCode = event.target.dataset.course;
        removeFromCart(courseCode);
    } else if (event.target.id === "clear-cart") {
        clearCart();
    }
});

function addToCart(courseCode) {
    const course = coursesData.find(course => course.courseCode === courseCode);
    const sectionName = event.target.dataset.section;
    if (course) {
        const courseWithSection = `${course.courseCode}-${sectionName || "N/A"}`;
        if (!cart.includes(courseWithSection)) {
            cart.push(courseWithSection);
            updateCartDisplay();
        }
    }
}

function removeFromCart(courseCode) {
    cart = cart.filter(course => course !== courseCode);
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartElement = document.getElementById("cart");
    const cartItems = document.getElementById("cart-items");

    cartItems.innerHTML = "";
    cart.forEach(course => {
        const li = document.createElement("li");
        li.innerHTML = `${course} <span class="cart-remove" data-course="${course}">❌</span>`;
        cartItems.appendChild(li);
    });

    cartElement.style.display = cart.length > 0 ? "block" : "none";
}
