document.addEventListener("DOMContentLoaded", () => {
    const cart = document.getElementById("cart");
    const toggleCart = document.getElementById("toggle-cart");
    const closeCart = document.getElementById("close-cart");

    toggleCart.addEventListener("click", () => {
        cart.classList.toggle("translate-x-full");
    });

    closeCart.addEventListener("click", () => {
        cart.classList.add("translate-x-full");
    });

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
        populateRoutineTable();
    } catch (error) {
        console.error("Error fetching courses:", error);
    } finally {
        loadingMessage.style.display = "none";
    }
}

function displayCourses(courses) {
    const courseList = document.getElementById("courseList");
    courseList.innerHTML = "";
    courses.forEach(course => {
        const secondaryCourse = secondaryData.find(sec => sec.courseCode === course.courseCode);
        const secondaryFaculty = secondaryData.find(sec => sec.empShortName === course.faculties);
        const courseTitle = secondaryCourse ? secondaryCourse.courseTitle : 'N/A';
        const empName = secondaryFaculty ? secondaryFaculty.empName : 'N/A';

        const finalExam = formatExamDate(course.sectionSchedule.finalExamDate, course.sectionSchedule.finalExamStartTime, course.sectionSchedule.finalExamEndTime);
        const midExam = formatExamDate(course.sectionSchedule.midExamDate, course.sectionSchedule.midExamStartTime, course.sectionSchedule.midExamEndTime);

        const remainingSeats = course.capacity - course.consumedSeat;
        let seatsClass = '';
        let buttonDisabled = '';
        if (remainingSeats === course.capacity) {
            seatsClass = 'seats-white';
        } else if (remainingSeats > course.capacity * 0.75) {
            seatsClass = 'seats-green';
        } else if (remainingSeats > course.capacity * 0.5) {
            seatsClass = 'seats-yellow';
        } else if (remainingSeats > 0) {
            seatsClass = 'seats-red';
        } else {
            seatsClass = 'seats-black';
            buttonDisabled = 'disabled';
        }

        const card = document.createElement("div");
        card.className = "course-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300";
        card.innerHTML = `
            <h3 class="text-lg font-semibold mb-1">${course.courseCode}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${courseTitle}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Section: ${course.sectionName || "N/A"}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                Faculty: <span class="font-bold">${course.faculties}</span> - ${empName}
            </p>
            <p class="seat-pill ${seatsClass}">
                <i class="fas fa-chair mr-1"></i> Seats: ${remainingSeats}/${course.capacity}
            </p>
            <div class="text-sm mt-2">
                <p>Class: ${formatSchedule(course.sectionSchedule.classSchedules, 'schedule')}</p>
                <p>Lab: ${formatSchedule(course.labSchedules, 'lab-schedule')}</p>
                <p>Exams: ${midExam.split(",")[0]} / ${finalExam.split(",")[0]}</p>
            </div>
            <button class="add-to-cart mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors ${buttonDisabled}" data-course="${course.courseCode}" data-section="${course.sectionName || 'N/A'}">
                Add to Cart <i class="fas fa-plus"></i>
            </button>
        `;
        courseList.appendChild(card);
    });
    document.getElementById("loadingMessage").style.display = "none";
}

function populateRoutineTable() {
    // Clear existing table content
    for (let row = 1; row <= 7; row++) {
        for (let col = 1; col <= 7; col++) {
            document.getElementById(`${row}-${col}`).innerHTML = '';
        }
    }

    // Map cart courses to routine
    cart.forEach(courseWithSection => {
        const [courseCode, sectionName] = courseWithSection.split('-');
        const course = coursesData.find(c => c.courseCode === courseCode && (c.sectionName || 'N/A') === sectionName);
        if (course) {
            // Process class schedules
            if (course.sectionSchedule.classSchedules) {
                course.sectionSchedule.classSchedules.forEach(({ day, startTime }) => {
                    const timeSlot = getTimeSlot(startTime);
                    const dayIndex = getDayIndex(day);
                    if (timeSlot && dayIndex) {
                        const cell = document.getElementById(`${timeSlot}-${dayIndex}`);
                        cell.innerHTML = `${course.courseCode} (${course.sectionName || 'N/A'})`;
                        cell.classList.add('bg-blue-100', 'dark:bg-blue-900', 'p-2', 'rounded');
                    }
                });
            }
            // Process lab schedules
            if (course.labSchedules) {
                course.labSchedules.forEach(({ day, startTime }) => {
                    const timeSlot = getTimeSlot(startTime);
                    const dayIndex = getDayIndex(day);
                    if (timeSlot && dayIndex) {
                        const cell = document.getElementById(`${timeSlot}-${dayIndex}`);
                        cell.innerHTML = `${course.courseCode} Lab (${course.sectionName || 'N/A'})`;
                        cell.classList.add('bg-green-100', 'dark:bg-green-900', 'p-2', 'rounded');
                    }
                });
            }
        }
    });
}

function getTimeSlot(startTime) {
    const [hour, minute] = startTime.split(':').map(Number);
    const time = hour * 60 + minute;
    if (time >= 480 && time < 560) return 1; // 08:00 AM - 09:20 AM
    if (time >= 570 && time < 650) return 2; // 09:30 AM - 10:50 AM
    if (time >= 660 && time < 740) return 3; // 11:00 AM - 12:20 PM
    if (time >= 750 && time < 830) return 4; // 12:30 PM - 01:50 PM
    if (time >= 840 && time < 920) return 5; // 02:00 PM - 03:20 PM
    if (time >= 930 && time < 1010) return 6; // 03:30 PM - 04:50 PM
    if (time >= 1020 && time < 1100) return 7; // 05:00 PM - 06:20 PM
    return null;
}

function getDayIndex(day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(day) + 1;
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
        li.className = "flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded";
        li.innerHTML = `${course} <span class="cart-remove text-red-500 cursor-pointer" data-course="${course}">❌</span>`;
        cartItems.appendChild(li);
    });

    cartElement.classList.toggle("translate-x-full", cart.length === 0);
    populateRoutineTable();
}
