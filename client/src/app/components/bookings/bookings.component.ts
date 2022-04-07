import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'
import { GlobalConstants } from 'src/app/common/global-constants';
import { flatMap } from 'rxjs';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {

  myBookingsData = [];
  myBookingsName:string[] = [];
  myBookingsDesc:string[] = [];

  imageURL = GlobalConstants.imageURL;

  constructor(private http: HttpClient, public router:Router) { }

  getServiceName(id:number) {
    this.http.get<any>(GlobalConstants.apiURL+'getServiceInfo?serviceId='+id)
      .subscribe(data => {
        this.myBookingsName.push( data.name );
      }
    )
  }

  getServiceDescription(id:number) {
    this.http.get<any>(GlobalConstants.apiURL+'getServiceInfo?serviceId='+id)
      .subscribe(data => {
        this.myBookingsDesc.push( data.description )
      }
    )
  }

  cancelBooking(bookingId:number) {
    this.http.get<any>(GlobalConstants.apiURL+'cancelBooking?id='+bookingId)
      .subscribe(data => {
        console.log(data)
        confirm('Service cancelled! :-(\nHope to see you again.')
        this.router.navigate(['/bookings']).then(() => {
          window.location.reload();
        });
      },
      err => {
        alert(err)
      }
    )
  }

  ngOnInit(): void {
    this.http.get<any>(GlobalConstants.apiURL+'getBookings?userId='+localStorage.getItem('id'))
      .subscribe(data => {
        console.log("-----------------/ My bookings page /-----------------")
        console.log(data);
        
        for (let i=0; i<data.length; i++) {
          this.getServiceName(data[i]['service_id']);
          this.getServiceDescription(data[i]['service_id']);
        }

        console.log(this.myBookingsName);
        console.log(this.myBookingsDesc);

        this.myBookingsData = data;

      }
    )
  }

}
