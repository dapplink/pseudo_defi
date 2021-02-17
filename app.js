let web3 = new Web3('https://rinkeby.infura.io/v3/add86235a9b94a798fe9330d58a94175');
const ADDRESS = '0x4F979310a99Db0c19aE92B627ff1B80E637904a6';
let contract = new web3.eth.Contract( abi, ADDRESS );

function Chart () {
    const self = {}
    let svg = d3.select('svg')
    const padding = 40
    const OFFSET = 30
    let width = svg.node().getBoundingClientRect().width
    let height = svg.node().getBoundingClientRect().height
    let range = Math.floor((width - padding) / OFFSET) - 1
    let xScale = function (i) {
	return i * OFFSET + 2 * padding;
    }
    let yScale = d3.scaleLinear()
	.domain([700, 1250]) // <-- 800 1350
	.range([height - padding + 35, 0])
    let yAxis = d3.axisLeft()
	.scale(yScale)
	.ticks(7)
    let line = d3.line()
	.x(function(d, i) {return xScale(i);})
	.y(function(d, i) {return yScale(d);})
	.curve(d3.curveCatmullRom)
    svg.append('g')
	.attr('class', 'axis')
	.attr('transform', 'translate(' + padding + ',0)')
	.call(yAxis);
    self.update = function (full_dataset, block_number_start) {
	let dataset = range > full_dataset.length ? full_dataset : full_dataset.slice(full_dataset.length - range)
	let block_numbers = new Array(dataset.length).fill(0)
	block_numbers.forEach(function (v, i, a) {a[i] = +block_number_start + i})
	d3
	    .select('svg')
	    .selectAll('circle')
	    .data(dataset) 
	    .enter()
	    .append('circle')
	    .attr('cx', (d, i) => xScale(i))
	    .attr('cy', (d, i) => yScale(d))
	    .attr('r',  5)
	    .attr('fill', 'red')
	d3
	    .select('svg')
	    .selectAll('.height-line')
	    .data(dataset)
	    .enter()
	    .append('line')
	    .attr('class','height-line')
	    .attr('x1', (d, i) => xScale(i))
	    .attr('y1', yScale(700))
	    .attr('x2', (d, i) => xScale(i))
	    .attr('y2', (d, i) => yScale(d))
	    .attr('stroke','red')
	    .attr('stroke-dasharray','2,2')
	d3
	    .selectAll('.height-line')
	    .data(dataset)
	    .attr('x1', (d, i) => xScale(i))
	    .attr('y1', yScale(700))
	    .attr('x2', (d, i) => xScale(i))
	    .attr('y2', (d, i) => yScale(d))
	d3
	    .select('svg')
	    .selectAll('.price-label')
	    .data(dataset)
	    .enter()
	    .append('text')
	    .attr('class','price-label')
	    .attr('x', (d, i) => xScale(i))
	    .attr('y', (d, i) => yScale(d + 25))
	    .attr('fill','black')
	    .attr('text-anchor','middle')
	    .style('font-size','10')
	    .text((d, i) => d )
	d3
	    .selectAll('.price-label')
	    .data(dataset)
	    .attr('x', (d, i) => xScale(i))
	    .attr('y', (d, i) => yScale(d + 25))
	    .text((d, i) => d)
	d3
	    .select('svg')
	    .selectAll('.block-number')
	    .data(block_numbers)
	    .enter()
	    .append('text')
	    .attr('class','block-number')
	    .attr('x', (d, i) => xScale(i))
	    .attr('y', (d, i) => yScale(700))
	    .attr('text-anchor','start')
	    .attr('text-rendering','optimizeLegibility')
	    .attr('transform',(d, i) => `rotate(-90, ${xScale(i) - 5}, ${yScale(700)})`)
	    .style('font-size','10')
	    .text(d => d)
	d3
	    .select('svg')
	    .selectAll('circle')
	    .data(dataset) 
	    .attr('cx', (d,i) => xScale(i))
	    .attr('cy', (d,i) => yScale(d))
    }
    return self
}
function Controller() {
    let my = {}
    let account
    var privateKey
    let updateBalancesTimer
    let updateChartTimer
    let blockNumberStart
    let price_history_array = []
    my.init = function () {
	d3.select('#controller-section').style('display', 'none')
	d3.select('#login-section').style('display', 'block')
	d3.select('#enter-button').on('click', my.login)
	d3.select('#eth-exchange-button').on('click', my.change_eth_to_pdt)
	d3.select('#pdt-exchange-button').on('click', my.change_pdt_to_eth)
	d3.select('#eth-send-button').on('click', my.send_eth_to_address)
	d3.select('#pdt-send-button').on('click', my.send_pdt_to_address)
	d3.select('#smart-contract-address').node().value = ADDRESS
	d3.select('#open-etherscan-button').on('click', _ => window.open('https://rinkeby.etherscan.io/address/' + ADDRESS))
	window.onresize = my.resize
	my.updateChart()
    }
    my.login = function () {
	privateKey = d3.select( '#private-key-input' ).node().value
	try {
	    let account_obj = web3.eth.accounts.privateKeyToAccount(privateKey)
	    account = account_obj.address
	    d3.select('#login-section').style('display', 'none')
	    d3.select('#controller-section').style('display', 'block')
	    my.updateBalances()
	} catch (err) {
	    my.error('Login failed')
	}
    }
    my.resize = function () {
	clearTimeout(updateChartTimer)
	d3.select('svg').html('')
	chart = Chart()
	my.updateChart()
    }
    my.updateBalances = function () {
	d3.select('#address').node().value = account
	web3.eth.getBalance(account).then(function (eth_balance) {
	    d3.select('#eth-balance').property('value', (+eth_balance / 10**18).toFixed(6))
	    contract.methods.balanceOf(account).call().then(function (token_balance) {
		d3.select('#pdt-balance').property('value', (+token_balance / 10**18).toFixed(2))
		updateBalancesTimer = setTimeout(my.updateBalances, 10 * 1000)
	    })
	})
    }
    my.updateChart = function () {
	contract.methods.getPriceHistory().call().then(function (price_history_object) {
	    if (!price_history_array.length) {
		web3.eth.getBlockNumber().then(function (blockNumber) {
		    blockNumberStart = blockNumber
		    for (let i in price_history_object) price_history_array.push(+price_history_object[i])
		    chart.update(price_history_array, blockNumberStart)
		    updateChartTimer = setTimeout(my.updateChart, 10 * 1000)
		}).catch(function (err) {
		    my.error('No connection')
		    return false
		})
	    } else {
		price_history_array.push(+price_history_object["0"])
		chart.update(price_history_array, blockNumberStart)
		timer = setTimeout(my.updateChart, 10 * 1000)
	    }
	})
    }
    my.change_eth_to_pdt = function () {
	let summ = d3.select('#eth-exchange-input').node().value
	if (isNaN(summ)) {
	    d3.select('#eth-exchange-input').node().value = ''
	    return
	}
	web3.eth.getTransactionCount(account, function (err, nonce) {
	    if (err) {
		my.error()
		return
	    }
	    var tx = new ethereumjs.Tx({
		nonce: nonce,
		gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'gwei')),
		gasLimit: 100000,
		to: ADDRESS,
		value: web3.utils.toHex(web3.utils.toWei(summ, 'ether'))
	    })
	    tx.sign(ethereumjs.Buffer.Buffer.from(privateKey, 'hex'))
	    var raw = '0x' + tx.serialize().toString('hex')
	    web3.eth.sendSignedTransaction(raw, function (err, transactionHash) {
		if (err) {
		    my.error()
		    return
		}
		d3.select('#eth-exchange-input').node().value = ''
		my.success(transactionHash)
	    })
	})
    }
    my.change_pdt_to_eth = function () {
	let summ = d3.select('#pdt-exchange-input').node().value
	if (isNaN(summ)) {
	    d3.select('#pdt-exchange-input').node().value = ''
	    return
	}
	web3.eth.getTransactionCount( account, function (err, nonce) {
	    if (err) {
		my.error()
		return
	    }
	    let data = contract.methods.transfer(ADDRESS, (+summ*10**18).toString()).encodeABI()
	    let tx = new ethereumjs.Tx({
		nonce: nonce,
		gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'gwei')),
		gasLimit: 100000,
		to: ADDRESS,
		data: data
	    })
	    tx.sign(ethereumjs.Buffer.Buffer.from(privateKey, 'hex'))
	    let raw = '0x' + tx.serialize().toString('hex')
	    web3.eth.sendSignedTransaction(raw, function (err, transactionHash) {
		if (err) {
		    my.error()
		    return
		}
		d3.select('#pdt-exchange-input').node().value = ''
		my.success(transactionHash)
	    })
	})
    }
    my.send_eth_to_address = function () {
	let summ = d3.select('#eth-send-amount-input').node().value
	let address = d3.select('#eth-send-address-input').node().value
	if (isNaN(summ)) {
	    d3.select('#eth-send-amount-input').node().value = ''
	    d3.select('#eth-send-address-input').node().value = ''
	    return
	}
	web3.eth.getTransactionCount(account, function (err, nonce) {
	    if (err) {
		my.error()
		return
	    }
	    var tx = new ethereumjs.Tx({
		nonce: nonce,
		gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'gwei')),
		gasLimit: 100000,
		to: address,
		value: web3.utils.toHex(web3.utils.toWei(summ, 'ether'))
	    })
	    tx.sign(ethereumjs.Buffer.Buffer.from(privateKey, 'hex'))
	    var raw = '0x' + tx.serialize().toString('hex')
	    web3.eth.sendSignedTransaction(raw, function (err, transactionHash) {
		if (err) {
		    my.error()
		    return
		}
		d3.select('#eth-send-amount-input').node().value = ''
		d3.select('#eth-send-address-input').node().value = ''
		my.success(transactionHash)
	    })
	})
    }
    my.send_pdt_to_address = function () {
	let summ = d3.select('#pdt-send-amount-input').node().value
	let address = d3.select('#pdt-send-address-input').node().value
	if (isNaN(summ)) {
	    d3.select('#pdt-send-amount-input').node().value = ''
	    d3.select('#pdt-send-address-input').node().value = ''
	    return
	}
	web3.eth.getTransactionCount(account, function (err, nonce) {
	    if (err) {
		my.error()
		return
	    }
	    let data = contract.methods.transfer(address, (+summ*10**18).toString()).encodeABI()
	    let tx = new ethereumjs.Tx({
		nonce: nonce,
		gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'gwei')),
		gasLimit: 100000,
		to: ADDRESS,
		data: data
	    })
	    tx.sign(ethereumjs.Buffer.Buffer.from(privateKey, 'hex'))
	    let raw = '0x' + tx.serialize().toString('hex')
	    web3.eth.sendSignedTransaction(raw, function (err, transactionHash) {
		if (err) {
		    my.error()
		    return
		}
		d3.select('#pdt-send-amount-input').node().value = ''
		d3.select('#pdt-send-address-input').node().value = ''
		my.success(transactionHash)
	    })
	})
    }
    my.success = function (transactionHash) {
	d3.select('#operation-success').html(`Transaction <strong>${transactionHash}</strong> has been successfully completed`)
	$('#operation-success').slideDown(1000).delay(1000).slideUp()
    }
    my.error = function (msg) {
	d3.select('#operation-error').text(msg == undefined ? 'Transaction failed' : msg)
	$('#operation-error').slideDown(1000).delay(1000).slideUp()
    }
    my.init();
    return my;
}

let controller = Controller();
let chart = Chart();
