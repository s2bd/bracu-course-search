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
        const courseTitle = secondaryCourse ? secondaryCourse.courseTitle : '';
        const empName = secondaryFaculty ? secondaryFaculty.empName : '';

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
        card.className = "bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300";
        card.innerHTML = `
            <h3 class="text-lg font-semibold mb-2" data-tooltip="${course.courseCode} - ${courseTitle}">
                ${course.courseCode} <i class="fas fa-info-circle text-blue-500"></i>
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Section: ${course.sectionName || "N/A"}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400" data-tooltip="${course.faculties} - ${empName}">
                Faculty: ${course.faculties} <i class="fas fa-user text-blue-500"></i>
            </p>
            <p class="text-sm ${seatsClass} mt-2">
                <i class="fas fa-chair"></i> Seats: ${remainingSeats}/${course.capacity}
            </p>
            <div class="text-sm mt-2">
                <p>Class: ${formatSchedule(course.sectionSchedule.classSchedules, 'schedule')}</p>
                <p>Lab: ${formatSchedule(course.labSchedules, 'lab-schedule')}</p>
                <p data-tooltip="Mid: ${midExam}, Final: ${finalExam}">
                    Exams: ${midExam.split(",")[0]} / ${finalExam.split(",")[0]}
                </p>
            </div>
            <button class="add-to-cart mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors ${buttonDisabled}" data-course="${course.courseCode}" data-section="${course.sectionName || 'N/A'}">
                Add to Cart <i class="fas fa-plus"></i>
            </button>
        `;
        courseList.appendChild(card);
    });
    document.getElementById("loadingMessage").style.display = "none";
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
}
