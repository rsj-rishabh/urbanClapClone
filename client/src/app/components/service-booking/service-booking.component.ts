import { Component, OnInit } from '@angular/core';
import { FormGroup,FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalConstants } from 'src/app/common/global-constants';

@Component({
  selector: 'app-service-booking',
  templateUrl: './service-booking.component.html',
  styleUrls: ['./service-booking.component.css']
})
export class ServiceBookingComponent implements OnInit {

  bookingForm = new FormGroup({
    date: new FormControl(''),
    time: new FormControl('')
  });

  serviceId = 0;
  serviceName = '';
  servicePrice = '';
  imageURL = GlobalConstants.imageURL;

  constructor(private http: HttpClient,public router:Router,private route:ActivatedRoute) { }

  onSubmit() {
    console.log(this.bookingForm.value)
    if (this.bookingForm.value.date == '' || this.bookingForm.value.time == '') {
      alert ('Please select appropriate date and time.')
    } else {
      

      var endTime: number = +this.bookingForm.value.time.split(':')[0] + 1

      var inpObject = {
        'user_id': Number(localStorage.getItem('id')),
        'service_id': Number(this.serviceId),
        'date': this.bookingForm.value.date,
        'start_time': this.bookingForm.value.time,
        'end_time': endTime.toString() + ':' + this.bookingForm.value.time.split(':')[1]
      }
      console.log(inpObject)

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded"
      }
  
      var post = this.http.post(GlobalConstants.apiURL+'bookService',inpObject,{headers});
      console.log(post);

      post.subscribe(
        data => {
          console.log(data);
          confirm('Service booked! Thank you.')
        },
        err => {
          alert(err)
        }
      )
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.serviceId = params['service_id']
      this.serviceName = params['service_name']
      this.servicePrice = params['service_price']
    })

   }

  highlight(event: any): void {
    event.target.style['border-bottom'] = "1px solid rgba(30, 40, 51, 0.9)";      
    event.target.style['opacity'] = "0.9";           
  }

  dampen(event: any): void {
    event.target.style['border-bottom'] = "1px solid rgba(30, 40, 51, 0.6)";      
    event.target.style['opacity'] = "0.6";           
  }

}
