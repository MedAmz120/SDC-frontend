$(function() {
    $(".btn").click(function() {
        $(".form-signin").toggleClass("form-signin-left");
        $(".form-signup").toggleClass("form-signup-left");
        $(".frame").toggleClass("frame-long");
        $(".signup-inactive").toggleClass("signup-active");
        $(".signin-active").toggleClass("signin-inactive");
        $(".forgot").toggleClass("forgot-left");
        $(this).removeClass("idle").addClass("active");
    });
});

$(function() {
    $(".btn-signup").click(function() {
        $(".nav").toggleClass("nav-up");
        $(".form-signup-left").toggleClass("form-signup-down");
        $(".success").toggleClass("success-left");
        $(".frame").toggleClass("frame-short");
    });
});

$(function() {
    $(".btn-signin").click(function() {
        $(".btn-animate").toggleClass("btn-animate-grow");
        $(".welcome").toggleClass("welcome-left");
        $(".cover-photo").toggleClass("cover-photo-down");
        $(".frame").toggleClass("frame-short");
        $(".profile-photo").toggleClass("profile-photo-down");
        $(".btn-goback").toggleClass("btn-goback-up");
        $(".forgot").toggleClass("forgot-fade");
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers
    const dateConfig = {
        enableTime: false,
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        maxDate: "today",  // Allow dates up to today
        theme: "dark"
    };

    flatpickr("#startDate", {
        ...dateConfig,
        onChange: function(selectedDates) {
            // Update end date min date when start date changes
            endDatePicker.set('minDate', selectedDates[0]);
        }
    });

    const endDatePicker = flatpickr("#endDate", {
        ...dateConfig,
        minDate: null,  // Allow any date for end date initially
        onChange: function(selectedDates) {
            updateMonthFields();
        }
    });

    function updateMonthFields() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const monthFields = document.getElementById('monthFields');
        
        if (!startDate || !endDate) return;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Clear existing month fields
        monthFields.innerHTML = '';
        
        // Calculate months between dates
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const monthName = currentDate.toLocaleString('default', { month: 'long' });
            const year = currentDate.getFullYear();
            
            const monthField = document.createElement('div');
            monthField.className = 'month-field mb-2';
            monthField.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="me-2">${monthName} ${year}:</span>
                    <input type="number" class="form-control form-control-sm" 
                           style="width: 80px;" 
                           min="1" 
                           value="1"
                           data-month="${currentDate.getMonth()}"
                           data-year="${year}">
                </div>
            `;
            
            monthFields.appendChild(monthField);
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
    }

    // Set default values for form fields
    document.getElementById('entryUrl').value = '-';
    document.getElementById('lineItem').value = '-';

    // Handle form submission
    document.getElementById('csvGeneratorForm').addEventListener('submit', function(e) {
        e.preventDefault();

        // Gather form data
        const formData = {
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            lineItem: document.getElementById('lineItem').value || '-',
            orderTotal: document.getElementById('orderTotal').value,
            entryUrl: document.getElementById('entryUrl').value || '-',
            trafficSources: {
                instagram: document.getElementById('instagramSource').checked ? 'yes' : 'no',
                facebook: document.getElementById('facebookSource').checked ? 'yes' : 'no',
                google: document.getElementById('googleSource').checked ? 'yes' : 'no'
            }
        };

        // Validate form
        if (!formData.startDate || !formData.endDate) {
            alert('Please select both start and end dates');
            return;
        }

        if (!formData.orderTotal || formData.orderTotal <= 0) {
            alert('Please enter a valid order total');
            return;
        }

        // Collect month data
        const monthData = {};
        document.querySelectorAll('#monthFields input').forEach(input => {
            const month = input.dataset.month;
            const year = input.dataset.year;
            const count = parseInt(input.value);
            if (count > 0) {
                monthData[`${year}-${month}`] = count;
            }
        });

        if (Object.keys(monthData).length === 0) {
            alert('Please specify at least one date count for a month');
            return;
        }

        // Add loading state to button
        const submitButton = this.querySelector('.btn-generate');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Generating...
        `;
        submitButton.disabled = true;

        // Format data for backend
        const requestData = {
            start_date: formData.startDate,
            end_date: formData.endDate,
            month_data: monthData,
            order_total: parseFloat(formData.orderTotal),
            line_item_1: formData.lineItem,
            session_entry: formData.entryUrl,
            platforms: {
                instagram: formData.trafficSources.instagram,
                facebook: formData.trafficSources.facebook,
                google: formData.trafficSources.google
            }
        };

        // Make API call to backend
        fetch('http://localhost:3000/generate-csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;

            if (data.success) {
                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = data.filePath;
                downloadLink.download = 'generated_data.csv';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

                alert('CSV file has been generated and downloaded successfully!');
            } else {
                alert('Error generating CSV file: ' + data.message);
            }
        })
        .catch(error => {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
            
            console.error('Error:', error);
            alert('An error occurred while generating the CSV file. Please try again.');
        });
    });

    // Add hover effect to parameter items
    document.querySelectorAll('.parameter-item').forEach(item => {
        item.addEventListener('mouseover', function() {
            this.style.background = 'rgba(255, 255, 255, 0.08)';
        });

        item.addEventListener('mouseout', function() {
            this.style.background = 'rgba(255, 255, 255, 0.05)';
        });
    });
}); 