
	loansetup = $("#loansetup")[0];
	addrow = $('#addrow')[0];
	fundsavail = $('#fundsavail')[0];
	loanprojections = $("#loanprojections")[0];

	loans = [];

	months=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
	// monthoffset=(new Date()).getMonth();
	// yearoffset=(new Date()).getYear();

function roundup(num){

	return  Math.ceil( num * 100 )/100;
}

function update(id,attr){
	if (id !==undefined && attr !==undefined){

		var val = $('#l'+id+'_'+attr)[0].value;
		//console.log("Updating, ", id, attr, val);

		loans[id][attr] = val;
	}

	window.location.hash = "#"+JSON.stringify({loans:loans, funds:fundsavail.value , optimization:$('#optimization')[0].value});

}

function recalculate(){
	var hasBalance = true;
	var count=0;
	var reportMonth;
	var reportYear;
	var newrow;
	var html;
	var reportDateTrack = new Date();
	var myloan, principalStart;

	var fundsAvailable = parseFloat(fundsavail.value);
	var tmpFunds=0;
	var tmpPmt = 0;

	var orPaid = 0;
	var mrPrincipal=0, mrCurrInterest=0, mrTotalInterest=0, mrPaid=0;

	var optimization = $("#optimization")[0].value; 


	function pay(objLoan, amt){
		var newAmt = Math.min(amt, objLoan.principalRemaining);
		objLoan.principalRemaining -= newAmt;
		orPaid += newAmt;
		mrPaid += newAmt;

		var datecrap = reportDateTrack.toString().split(' ');
		$('#l'+loans.indexOf(objLoan)+'_freedom')[0].innerHTML = datecrap[1]+' '+datecrap[3];

		return amt - newAmt;
	}



	loanprojections.innerHTML="";

	//console.log("Hamster running on wheeel...");

	while ( hasBalance ){
		mrPrincipal=0, mrCurrInterest=0, mrTotalInterest=0, mrPaid=0;

		hasBalance = false;

		tmpFunds = fundsAvailable;

		reportMonth = months[reportDateTrack.getMonth()];
		reportYear = reportDateTrack.getFullYear();
		//console.log(reportMonth);
		++count;

		// Buid out this month's iteration header
		newrow = document.createElement('tr');
		newrow.className = 'MonthIteration'
		newrow.innerHTML = "<td colspan=6>("+count+") Month: "+reportMonth+" of "+reportYear+""
		loanprojections.appendChild(newrow);





		// Build out this month's iteration of line items
		// Make Minimum payments
		for (var i=0; i < loans.length; ++i){
			myloan = loans[i];
			myloan.interestCurrent = 0;

			if (count===1) { // Reset our nonsense.
				myloan.interestTotal = 0;
				myloan.principalRemaining = myloan.principal;
				myloan.incline = 0;
			}


			// Shall we report on this account for this month?
			if (
					// Have we enough data?
					parseInt(myloan.principal) && parseInt(myloan.payment) &&
					// Are we paid off?
					myloan.principalRemaining>0 &&
					// Have we been increasing our balance for over 48 months?
					myloan.incline < 48

			){


				principalStart = myloan.principalRemaining;


				myloan.interestCurrent = ( principalStart * (myloan.apr/100) ) / 12;
				myloan.interestCurrent = roundup( myloan.interestCurrent );
				myloan.interestTotal+=myloan.interestCurrent;
				myloan.interestTotal = roundup( myloan.interestTotal );

				tmpPmt = Math.min(parseFloat(myloan.payment), tmpFunds, parseFloat(myloan.principalRemaining)+myloan.interestCurrent);
				tmpFunds = tmpFunds - tmpPmt;
				//orPaid += tmpPmt;
				//mrPaid += tmpPmt;

				myloan.principalRemaining = parseFloat(principalStart) + parseFloat(myloan.interestCurrent);
				//myloan.principalRemaining = roundup( myloan.principalRemaining );
				pay(myloan, tmpPmt)

				if (myloan.principalRemaining > principalStart){
					myloan.incline++;
				} else {
					myloan.incline = 0;
				}

				newrow = document.createElement('tr');
				newrow.className = '';
				if (myloan.incline) newrow.className += ' incline';
				if (tmpPmt < myloan.payment) newrow.className += ' default';
				html = "<td>"+myloan.name+"</td>";
				html += "<td>"+roundup(tmpPmt)+"</td>";
				html += "<td>"+roundup(myloan.principalRemaining)+"</td>"; mrPrincipal += parseFloat(myloan.principalRemaining);
				html += "<td>"+myloan.apr+"</td>";
				html += "<td>"+myloan.interestCurrent+"</td>"; mrCurrInterest += parseFloat(myloan.interestCurrent);
				html += "<td>"+myloan.interestTotal+"</td>";

				newrow.innerHTML = html;
				loanprojections.appendChild(newrow);

				hasBalance = true

				// Are we free?
				if (myloan.principalRemaining <=0){
					$('#l'+i+'_total')[0].innerHTML = myloan.interestTotal;
				}
			}

		}


		// Allocate leftover funds for extra paments
		if (tmpFunds > 0 && optimization!=='manual'){
			switch (optimization){
				case "allToHighestMonthlyInterest":
					var delcnt =0;
					while( tmpFunds > 0 ){
						// Find the highest current interest.
						var sortloans = loans.concat();

						// Don't sort the things with no balance
						for (var i2=0; i2<sortloans.length; ++i2){
							if (sortloans[i2].principalRemaining <= 0)
								sortloans.splice(sortloans.indexOf(sortloans[i2]),1);
						}

						var winner = sortloans.sort(function(a,b){return (b.interestCurrent||0)-(a.interestCurrent||0)})[0];
						console.log(winner, winner.interestCurrent);

						if ( winner.principalRemaining<=0) {
							break;
						}

						tmpPmt = Math.min(winner.principalRemaining, tmpFunds);
						tmpFunds -= tmpPmt;
						pay(winner, tmpPmt);

						var extranewrow = document.createElement('tr');
						extranewrow.className = 'extraPmt';

						html = "<td>"+winner.name+"</td>";
						html += "<td>"+roundup(tmpPmt)+"</td>";
						html += "<td>"+roundup(winner.principalRemaining)+"</td>";
						html += "<td></td>";
						html += "<td></td>";
						html += "<td></td>";
						extranewrow.innerHTML = html;

						loanprojections.appendChild(extranewrow);

					}				
				break;

			}
		}
		// for (var i=0; i < loans.length; ++i){
		// 	myloan = loans[i];
		// }


		///////////////////////////////////
		//   Monthly Report
		///////////////////////////////////
		newrow = document.createElement('tr');
		newrow.className = 'monthlyTotal';
		newrow.innerHTML = "<td>("+roundup(tmpFunds)+" leftover funds)</td>";
		newrow.innerHTML += "<td>"+mrPaid+"</td>";
		newrow.innerHTML += "<td>"+roundup(mrPrincipal)+"</td>"
		newrow.innerHTML += "<td></td>";
		newrow.innerHTML += "<td>"+roundup( mrCurrInterest )+"</td>";

		loanprojections.appendChild(newrow);

		reportDateTrack.setMonth( reportDateTrack.getMonth()+1 );

	}

	/////////////////////////////////////
	// Overall Report...
	//////////////////////////////////////

	// Report on total interest paid overall
	var totalInterest = 0;
	for (var i =0; i< loans.length; ++i){
		console.log(totalInterest, loans[i].interestTotal)
		totalInterest += loans[i].interestTotal;
	}
	$('#rptTotalInterestPaid')[0].innerHTML = roundup(totalInterest);
	$('#rptTotalPaid')[0].innerHTML = roundup(orPaid);

	datecrap = reportDateTrack.toString().split(' ');
	$('#rptFreedomDate')[0].innerHTML = datecrap[1]+' '+datecrap[3];


}

function addloan(config){
	//console.log("adding");
	var newrow = document.createElement('tr');
	var html = "";
	var loan = {
		name:"",
		principal:"",
		apr:0.0,
		payment:0
	};
	var id = ( loans.push(loan) -1 );

	config = config || {};

	html += "<td><input type='text' id='l"+id+"_name' onchange='update("+id+",\"name\");' /></td>";
	html += "<td><input type='text' id='l"+id+"_principal' onchange='update("+id+",\"principal\");'  /></td>";
	html += "<td><input type='text' id='l"+id+"_apr' onchange='update("+id+",\"apr\");' /></td>";
	html += "<td><input type='text' id='l"+id+"_payment' onchange='update("+id+",\"payment\");' /></td>";
	html += "<td><span id='l"+id+"_freedom'></span></td>";
	html += "<td><span id='l"+id+"_total'></span></td>";


	newrow.innerHTML = html;
	loansetup.insertBefore( newrow, addrow );

	return id;

}
