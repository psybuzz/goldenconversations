					var goldNum = 2;
					var goldPlatedNum = 2;
					var regHofNum = 2;

					$(document).ready(function(){
						$('.regNum').text(regHofNum);
						$('.gpNum').text(goldPlatedNum);
						$('.gNum').text(goldNum);
					});
				    var $window = $(window);
		
			        var dataset = [
			          { label: 'gold', count: goldNum }, 
			          { label: 'goldPlated', count: goldPlatedNum },
			          { label: 'regHof', count: regHofNum }
			        ];

			        var width = 142;
			        var height = 142;
			        var donutWidth = 20;

			        // reize svg for responsive screens;
			        function checkWidth() {
				        var windowsize = $window.width();
				        if (windowsize > 820 && windowsize < 1190) {
				            width = 90;
				            height = 90;
				            donutWidth = 12;
				        } else {
				        	width = 145;
			        		height = 145;
			        		donutWidth = 20;
				        }
				    }

				    checkWidth();

			        var radius = Math.min(width, height) / 2;

			        var color = d3.scale.category20b();

			        var svg = d3.select('#chart')
			          .append('svg')
			          .attr('width', width)
			          .attr('height', height)
			          .append('g')
			          .attr('transform', 'translate(' + (width / 2) + 
			            ',' + (height / 2) + ')');

			        var arc = d3.svg.arc()
			          .innerRadius(radius - donutWidth)
			          .outerRadius(radius);
			          
			        var pie = d3.layout.pie()
			          .value(function(d) { return d.count; })
			          .sort(null);

			        var path = svg.selectAll('path')
			          .data(pie(dataset))
			          .enter()
			          .append('path')
			          .attr('d', arc)
			          .attr('fill', function(d, i) { 
			            return color(d.data.label);
			        });
				   